"""Deterministic golden evaluation checks — no LOGOS, no DB, no K8s."""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

# Prevent db.py from crashing on import (same pattern as tests/conftest.py).
for _name, _value in {
    "COURSES_DB_NAME": "x",
    "DB_USER": "x",
    "DB_PASS": "x",
    "DB_HOST": "x",
    "DB_PORT": "0",
}.items():
    os.environ.setdefault(_name, _value)

sys.path.insert(0, str(Path(__file__).parents[1]))

from pydantic import ValidationError

from evals.contracts import EvalCourse, EvalSuite
from models.advisor import AdvisorRequest
from models.recommendations import CourseRef, RecommendationsRequest
from models.roadmap import RoadmapRequest
from prompt_config import validate_all_specs
from services.advisor import _append_course_context
from services.advisor import _build_messages as build_advisor_messages
from services.recommendations import _build_prompt
from services.roadmap import _build_messages as build_roadmap_messages

ROOT = Path(__file__).parent


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def check_fixture_schemas() -> tuple[EvalSuite | None, dict[int, EvalCourse] | None, list[str]]:
    failures: list[str] = []
    suite = None
    courses = None
    try:
        suite = EvalSuite.model_validate(_load_json(ROOT / "fixtures" / "cases.v1.json"))
    except (ValidationError, json.JSONDecodeError) as e:
        failures.append(f"cases.v1.json schema: {e}")
    try:
        raw = _load_json(ROOT / "fixtures" / "courses.v1.json")
        courses = {
            c.course_id: EvalCourse.model_validate(item)
            for item, c in ((item, EvalCourse.model_validate(item)) for item in raw["courses"])
        }
    except (ValidationError, json.JSONDecodeError, KeyError) as e:
        failures.append(f"courses.v1.json schema: {e}")
    try:
        RoadmapRequest.model_validate(_load_json(ROOT / "fixtures" / "roadmap-contract.v1.json"))
    except (ValidationError, json.JSONDecodeError) as e:
        failures.append(f"roadmap-contract.v1.json schema: {e}")
    return suite, courses, failures


def check_request_deserialization(suite: EvalSuite) -> list[str]:
    failures: list[str] = []
    for case in suite.cases:
        try:
            if case.type == "recommendations":
                RecommendationsRequest.model_validate(case.request)
            elif case.type == "roadmap":
                RoadmapRequest.model_validate(case.request)
            elif case.type == "advisor":
                AdvisorRequest.model_validate(case.request)
            elif case.type == "retrieval" and "query" not in case.request:
                failures.append(f"{case.id}: retrieval case missing 'query' key")
        except ValidationError as e:
            failures.append(f"{case.id}: {case.type} request deserialization failed: {e}")
    return failures


def check_referential_integrity(suite: EvalSuite, courses: dict[int, EvalCourse]) -> list[str]:
    failures: list[str] = []
    all_ids = set(courses.keys())
    for case in suite.cases:
        unknown_candidates = set(case.candidate_ids) - all_ids
        if unknown_candidates:
            failures.append(f"{case.id}: candidateIds not in courses fixture: {sorted(unknown_candidates)}")
        unknown_excluded = set(case.excluded_ids) - all_ids
        if unknown_excluded:
            failures.append(f"{case.id}: excludedIds not in courses fixture: {sorted(unknown_excluded)}")
        if case.type == "retrieval":
            relevant = set(case.hard_rules.get("relevantIds", []))
            outside = relevant - set(case.candidate_ids)
            if outside:
                failures.append(f"{case.id}: relevantIds not subset of candidateIds: {sorted(outside)}")
    return failures


def check_prompt_construction(suite: EvalSuite, courses: dict[int, EvalCourse]) -> list[str]:
    failures: list[str] = []
    for case in suite.cases:
        try:
            if case.type == "recommendations":
                request = RecommendationsRequest.model_validate(case.request)
                candidates = [
                    (
                        CourseRef(
                            courseId=c.course_id,
                            courseCode=c.course_code,
                            courseName=c.course_name,
                            credits=c.credits,
                            description=c.description,
                        ),
                        1.0 - i * 0.01,
                    )
                    for i, cid in enumerate(case.candidate_ids)
                    if (c := courses[cid])
                ]
                result = _build_prompt(request, request.student.career_goals, request.student.interests, candidates)
                if not result or not result.strip():
                    failures.append(f"{case.id}: recommendations prompt is empty")
            elif case.type == "roadmap":
                request = RoadmapRequest.model_validate(case.request)
                messages = build_roadmap_messages(request)
                if not messages:
                    failures.append(f"{case.id}: roadmap messages empty")
            elif case.type == "advisor":
                request = AdvisorRequest.model_validate(case.request)
                messages = build_advisor_messages(request)
                fixed = [
                    (
                        CourseRef(
                            courseId=courses[cid].course_id,
                            courseCode=courses[cid].course_code,
                            courseName=courses[cid].course_name,
                            credits=courses[cid].credits,
                            description=courses[cid].description,
                        ),
                        1.0,
                    )
                    for cid in case.candidate_ids
                ]
                _append_course_context(messages, fixed)
                if not messages:
                    failures.append(f"{case.id}: advisor messages empty")
        except Exception as e:
            failures.append(f"{case.id}: prompt construction failed: {e}")
    return failures


def check_prompt_specs() -> list[str]:
    try:
        validate_all_specs()
        return []
    except ValueError as e:
        return [str(e)]


def run(args: argparse.Namespace) -> int:
    results: list[dict[str, Any]] = []

    suite, courses, schema_failures = check_fixture_schemas()
    results.append({"id": "fixture-schemas", "type": "deterministic", "hardFailures": schema_failures})

    if suite is None or courses is None:
        results.append(
            {"id": "remaining-checks", "type": "deterministic", "hardFailures": ["skipped: fixture schemas invalid"]}
        )
    else:
        deser = check_request_deserialization(suite)
        results.append({"id": "request-deserialization", "type": "deterministic", "hardFailures": deser})

        integrity = check_referential_integrity(suite, courses)
        results.append({"id": "referential-integrity", "type": "deterministic", "hardFailures": integrity})

        prompts = check_prompt_construction(suite, courses)
        results.append({"id": "prompt-construction", "type": "deterministic", "hardFailures": prompts})

    specs = check_prompt_specs()
    results.append({"id": "prompt-specs", "type": "deterministic", "hardFailures": specs})

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    output = {"results": results}
    (output_dir / "results.json").write_text(json.dumps(output, indent=2) + "\n")

    hard_failures = [f"{r['id']}: {f}" for r in results for f in r["hardFailures"]]
    summary = ["# GenAI Deterministic Evaluation", ""]
    summary += [f"- **{r['id']}** — {'FAIL' if r['hardFailures'] else 'PASS'}" for r in results]
    if hard_failures:
        summary += ["", "## Hard failures", *[f"- {f}" for f in hard_failures]]
    (output_dir / "summary.md").write_text("\n".join(summary) + "\n")

    return 1 if hard_failures else 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="eval-results")
    raise SystemExit(run(parser.parse_args()))


if __name__ == "__main__":
    main()
