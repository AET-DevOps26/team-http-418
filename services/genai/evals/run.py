"""Live LOGOS golden evaluation with deterministic hard-invariant checks."""

import argparse
import asyncio
import json
import math
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import ValidationError

from evals.contracts import EvalCourse, EvalSuite
from llm.embeddings import get_active_model, get_embeddings
from llm.provider import get_llm, get_provider_info
from models.advisor import AdvisorRequest
from models.recommendations import CourseRef, RecommendationSelection, RecommendationsRequest
from models.roadmap import RoadmapGeneration, RoadmapRequest
from services.advisor import _append_course_context
from services.advisor import _build_messages as build_advisor_messages
from services.recommendations import _build_prompt
from services.roadmap import _build_messages as build_roadmap_messages

ROOT = Path(__file__).parent
JUDGE_DIMENSIONS = ["relevance", "personalization", "grounding", "specificity", "actionability", "feasibility"]


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def _course_map(courses: list[EvalCourse]) -> dict[int, EvalCourse]:
    return {course.course_id: course for course in courses}


def _cosine(a: list[float], b: list[float]) -> float:
    denominator = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return sum(x * y for x, y in zip(a, b, strict=True)) / denominator if denominator else 0.0


async def _invoke_with_retry(messages: list) -> str:
    """Retry transport failures once; callers validate hard invariants separately."""
    last_error: Exception | None = None
    for _ in range(2):
        try:
            result = await get_llm().ainvoke(messages)
            if not isinstance(result.content, str) or not result.content.strip():
                raise ValueError("empty model response")
            return result.content
        except Exception as error:  # provider failures are intentionally retried once
            last_error = error
    raise RuntimeError(f"LOGOS invocation failed after retry: {last_error}")


async def _invoke_json_with_retry(messages: list, validator):
    """Retry exactly once when the provider or its JSON/schema output is malformed."""
    last_error: Exception | None = None
    for _ in range(2):
        try:
            result = await get_llm().ainvoke(messages)
            raw = result.content
            if not isinstance(raw, str) or not raw.strip():
                raise ValueError("empty model response")
            return raw, validator(raw)
        except Exception as error:
            last_error = error
    raise RuntimeError(f"LOGOS JSON invocation failed after retry: {last_error}")


async def _judge(case_id: str, answer: str, case: dict) -> dict[str, float] | None:
    rubric = ", ".join(case.get("rubric", JUDGE_DIMENSIONS))
    prompt = (
        "You are a strict evaluation judge. Score the answer from 1 to 5 for these dimensions: "
        f"{rubric}. Return only JSON with numeric keys relevance, personalization, grounding, "
        "specificity, actionability, feasibility. Do not reward unsupported course claims.\n"
        f"Case: {case_id}\nRequest: {json.dumps(case.get('request', {}))}\nAnswer: {answer}"
    )
    try:
        _, scores = await _invoke_json_with_retry([SystemMessage(content=prompt)], json.loads)
        return {dimension: float(scores[dimension]) for dimension in JUDGE_DIMENSIONS if dimension in scores}
    except (KeyError, TypeError, ValueError, ValidationError, json.JSONDecodeError):
        return None


def _validate_ids(ids: list[int], allowed: set[int], excluded: set[int]) -> list[str]:
    errors = []
    if len(ids) != len(set(ids)):
        errors.append("duplicate course IDs")
    unknown = set(ids) - allowed
    if unknown:
        errors.append(f"hallucinated course IDs: {sorted(unknown)}")
    forbidden = set(ids) & excluded
    if forbidden:
        errors.append(f"excluded/completed/enrolled course IDs: {sorted(forbidden)}")
    return errors


async def _recommendations(case, courses: dict[int, EvalCourse]) -> tuple[str, list[str]]:
    request_data = dict(case.request)
    request_data["excludeCourseIds"] = sorted(set(request_data.get("excludeCourseIds", [])) | set(case.excluded_ids))
    request = RecommendationsRequest.model_validate(request_data)
    candidates = [
        (
            CourseRef(
                courseId=c.course_id,
                courseCode=c.course_code,
                courseName=c.course_name,
                credits=c.credits,
                category=c.category,
                description=c.description,
            ),
            1.0 - index * 0.01,
        )
        for index, course_id in enumerate(case.candidate_ids)
        if (c := courses[course_id])
    ]
    prompt = _build_prompt(request, request.student.career_goals, request.student.interests, candidates)
    try:

        def parse_contract(raw: str) -> list[dict]:
            payload = json.loads(raw)
            if not isinstance(payload, list):
                raise ValueError("LLM returned unexpected structure")
            return [RecommendationSelection.model_validate(item).model_dump(by_alias=True) for item in payload]

        answer, selections = await _invoke_json_with_retry(
            [SystemMessage(content=prompt), HumanMessage(content="Return the JSON array.")],
            parse_contract,
        )
        ids = [selection["courseId"] for selection in selections]
        excluded = set(case.excluded_ids) | set(request.exclude_course_ids or [])
        failures = _validate_ids(ids, set(case.candidate_ids), excluded)
        return answer, failures
    except (ValueError, ValidationError, json.JSONDecodeError) as error:
        return answer, [f"invalid recommendation output: {error}"]


async def _roadmap(case, courses: dict[int, EvalCourse]) -> tuple[str, list[str]]:
    request = RoadmapRequest.model_validate(case.request)
    try:
        answer, result = await _invoke_json_with_retry(
            build_roadmap_messages(request), RoadmapGeneration.model_validate_json
        )
    except ValidationError as error:
        return answer, [f"invalid roadmap output: {error}"]
    errors: list[str] = []
    allowed = set(case.candidate_ids)
    excluded = set(case.excluded_ids) | {
        course.course_id for course in request.completed_courses + request.enrolled_courses
    }
    cap = request.student.preferences.max_credits_per_semester if request.student.preferences else 30
    for semester in result.semesters:
        ids = [course.course_id for course in semester.courses]
        errors.extend(_validate_ids(ids, allowed, excluded))
        actual = sum(courses[course_id].credits for course_id in ids if course_id in courses)
        if actual != semester.total_credits:
            errors.append(f"{semester.semester_key}: totalCredits does not equal fixture ECTS")
        if actual > cap:
            errors.append(f"{semester.semester_key}: exceeds {cap}-ECTS cap")
    return answer, sorted(set(errors))


async def _advisor(case, courses: dict[int, EvalCourse]) -> tuple[str, list[str]]:
    request = AdvisorRequest.model_validate(case.request)
    messages = build_advisor_messages(request)
    fixed = [
        (
            CourseRef(
                courseId=courses[i].course_id,
                courseCode=courses[i].course_code,
                courseName=courses[i].course_name,
                credits=courses[i].credits,
                description=courses[i].description,
            ),
            1.0,
        )
        for i in case.candidate_ids
    ]
    _append_course_context(messages, fixed)
    answer = await _invoke_with_retry(messages)
    errors = []
    if not answer.strip():
        errors.append("empty advisor response")
    if '"isQuery"' in answer or '"query"' in answer:
        errors.append("advisor exposed internal search-query JSON")
    return answer, errors


async def _retrieval(case, courses: dict[int, EvalCourse]) -> tuple[str, list[str], dict[str, float]]:
    corpus = [courses[course_id] for course_id in case.candidate_ids]
    texts = [f"Title: {c.course_name} | Description: {c.description} | Category: {c.category}" for c in corpus]
    embeddings = get_embeddings()
    vectors = await embeddings.aembed_documents(texts)
    query = case.request["query"]
    query_vector = await embeddings.aembed_query(query)
    ranked_pairs = list(zip((_cosine(query_vector, vector) for vector in vectors), corpus, strict=True))
    ranked = [course.course_id for _, course in sorted(ranked_pairs, key=lambda item: item[0], reverse=True)]
    relevant = set(case.hard_rules["relevantIds"])
    top = ranked[:5]
    recall = len(set(top) & relevant) / len(relevant)
    first = next((index + 1 for index, course_id in enumerate(top) if course_id in relevant), None)
    mrr = 1 / first if first else 0.0
    errors = []
    if recall < 0.80:
        errors.append(f"Recall@5 {recall:.2f} is below 0.80")
    if mrr < 0.65:
        errors.append(f"MRR {mrr:.2f} is below 0.65")
    return json.dumps({"rankedIds": ranked[:5]}), errors, {"recallAt5": recall, "mrr": mrr}


def _warnings(results: list[dict], baseline: dict | None, models: dict) -> list[str]:
    warnings: list[str] = []
    scores = [score for result in results for score in (result.get("judgeScores") or {}).values()]
    aggregate = sum(scores) / len(scores) if scores else None
    if aggregate is not None and aggregate < 3.5:
        warnings.append(f"aggregate judge quality {aggregate:.2f} is below 3.5")
    for result in results:
        for dimension, score in (result.get("judgeScores") or {}).items():
            if score < 3:
                warnings.append(f"{result['id']}: {dimension} score {score:.2f} is below 3.0")
    if baseline and baseline.get("models") == models and aggregate is not None:
        old = baseline.get("aggregateJudgeScore")
        if old is not None and aggregate <= old - 0.25:
            warnings.append(f"aggregate score dropped {old - aggregate:.2f} (threshold 0.25)")
        for result in results:
            old_case = baseline.get("caseScores", {}).get(result["id"])
            new_case = result.get("aggregateJudgeScore")
            if old_case is not None and new_case is not None and new_case <= old_case - 0.5:
                warnings.append(f"{result['id']} score dropped {old_case - new_case:.2f} (threshold 0.5)")
    elif baseline:
        warnings.append("model identifiers changed; judge baseline recalibration is required")
    return warnings


async def run(args: argparse.Namespace) -> int:
    suite = EvalSuite.model_validate(_load_json(ROOT / "fixtures" / "cases.v1.json"))
    courses = {
        c.course_id: c
        for c in [
            EvalCourse.model_validate(item) for item in _load_json(ROOT / "fixtures" / "courses.v1.json")["courses"]
        ]
    }
    selected = [case for case in suite.cases if not args.case or case.id in args.case]
    results = []
    for case in selected:
        result: dict[str, Any] = {"id": case.id, "type": case.type, "hardFailures": []}
        try:
            if case.type == "recommendations":
                answer, failures = await _recommendations(case, courses)
            elif case.type == "roadmap":
                answer, failures = await _roadmap(case, courses)
            elif case.type == "advisor":
                answer, failures = await _advisor(case, courses)
            else:
                answer, failures, metrics = await _retrieval(case, courses)
                result["metrics"] = metrics
            result["answer"] = answer
            result["hardFailures"] = failures
            if case.type != "retrieval":
                result["judgeScores"] = await _judge(case.id, answer, case.model_dump(by_alias=True))
                scores = list((result["judgeScores"] or {}).values())
                result["aggregateJudgeScore"] = sum(scores) / len(scores) if scores else None
        except Exception as error:
            result["hardFailures"] = [f"infrastructure failure: {error}"]
        results.append(result)
    models = {"llm": get_provider_info(), "embedding": get_active_model()}
    baseline = _load_json(Path(args.baseline)) if args.baseline and Path(args.baseline).exists() else None  # noqa: ASYNC240
    warnings = _warnings(results, baseline, models)
    output = {"generatedAt": datetime.now(UTC).isoformat(), "models": models, "results": results, "warnings": warnings}
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)  # noqa: ASYNC240
    (output_dir / "results.json").write_text(json.dumps(output, indent=2) + "\n")
    hard_failures = [f"{r['id']}: {failure}" for r in results for failure in r["hardFailures"]]
    summary = ["# GenAI Golden Evaluation", "", f"Models: `{json.dumps(models)}`", ""]
    summary += [f"- **{r['id']}** — {'FAIL' if r['hardFailures'] else 'PASS'}" for r in results]
    if warnings:
        summary += ["", "## Non-blocking quality warnings", *[f"- {warning}" for warning in warnings]]
    if hard_failures:
        summary += ["", "## Hard failures", *[f"- {failure}" for failure in hard_failures]]
    (output_dir / "summary.md").write_text("\n".join(summary) + "\n")
    if args.emit_candidate_baseline:
        case_scores = {r["id"]: r["aggregateJudgeScore"] for r in results if r.get("aggregateJudgeScore") is not None}
        all_scores = list(case_scores.values())
        candidate = {
            "models": models,
            "aggregateJudgeScore": sum(all_scores) / len(all_scores) if all_scores else None,
            "caseScores": case_scores,
        }
        (output_dir / "candidate-baseline.json").write_text(json.dumps(candidate, indent=2) + "\n")
    return 1 if hard_failures else 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="eval-results")
    parser.add_argument("--baseline", default=str(ROOT / "baseline.json"))
    parser.add_argument("--case", action="append")
    parser.add_argument("--emit-candidate-baseline", action="store_true")
    raise SystemExit(asyncio.run(run(parser.parse_args())))


if __name__ == "__main__":
    main()
