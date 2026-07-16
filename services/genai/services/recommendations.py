import json
import logging
from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException
from langchain_core.messages import HumanMessage, SystemMessage
from psycopg2 import DatabaseError, OperationalError

from db import ensure_schema_initialized
from llm.embeddings import get_embedding_dimensions, get_embeddings
from llm.provider import get_llm
from models.recommendations import CourseRef, RecommendationSelection, RecommendationsRequest
from repositories.courses import get_course_refs
from repositories.recommendations import find_similar_courses

_RECOMMENDATIONS_PROMPT = (Path(__file__).parent.parent / "prompts" / "recommendations.txt").read_text()

logger = logging.getLogger("genai")


def _build_query(
    goals: list[str],
    interests: list[str],
    skills: list[str] | None = None,
    study_program: str | None = None,
    semester: int | None = None,
) -> str:
    parts = goals + interests + (skills or [])
    if study_program and study_program != "no study program":
        parts.append(study_program)
    if semester:
        parts.append(f"semester {semester}")
    return " ".join(parts)


def _build_prompt(
    request: RecommendationsRequest,
    goals: list[str],
    interests: list[str],
    candidates: list[tuple[CourseRef, float]],
) -> str:
    completed_names = request.completed_courses
    courses_text = "\n".join(
        f"- courseId={course.course_id} | {course.course_name} | score={score:.3f}"
        + (f" | {course.description}" if course.description else "")
        for course, score in candidates
    )

    skills = request.student.skills or []
    career_lines = []
    if request.student.industry_preference:
        career_lines.append(f"- Industry preference: {request.student.industry_preference}")
    if request.student.role_preference:
        career_lines.append(f"- Role preference: {request.student.role_preference}")
    career_context = ("\n" + "\n".join(career_lines) + "\n") if career_lines else ""
    enrolled_names = request.enrolled_courses or []

    return _RECOMMENDATIONS_PROMPT.format(
        limit=request.limit,
        study_program=request.student.study_program or "not specified",
        semester=request.student.semester,
        current_semester_key=request.current_semester_key or "not specified",
        goals=", ".join(goals) or "not specified",
        interests=", ".join(interests) or "not specified",
        skills=", ".join(skills) or "not specified",
        completed_names=", ".join(completed_names) or "none",
        enrolled_names=", ".join(enrolled_names) or "none",
        courses_text=courses_text,
        career_context=career_context,
    )


def _filter_candidates(
    request: RecommendationsRequest, candidates: list[tuple[CourseRef, float]]
) -> list[tuple[CourseRef, float]]:
    """Apply every eligibility rule before a candidate reaches the LLM prompt."""
    excluded_ids = set(request.exclude_course_ids or [])
    unavailable = set(request.available_courses or [])
    completed = set(request.completed_courses or [])
    enrolled = set(request.enrolled_courses or [])

    def eligible(course: CourseRef) -> bool:
        if course.course_id in excluded_ids:
            return False
        if course.course_name in completed or course.course_code in completed:
            return False
        if course.course_name in enrolled or course.course_code in enrolled:
            return False
        if unavailable and str(course.course_id) not in unavailable and course.course_code not in unavailable:
            return False
        category = (request.category or "").strip().casefold()
        return not category or category == "all" or (course.category or "").casefold() == category

    return [(course, score) for course, score in candidates if eligible(course)]


def _parse_selections(payload: object, allowed_ids: set[int]) -> list[dict]:
    if not isinstance(payload, list):
        raise ValueError("LLM returned unexpected structure")
    selections = [RecommendationSelection.model_validate(item) for item in payload]
    ids = [selection.course_id for selection in selections]
    if len(ids) != len(set(ids)):
        raise ValueError("LLM returned duplicate course IDs")
    if not set(ids).issubset(allowed_ids):
        raise ValueError("LLM returned a course outside the candidate corpus")
    return [selection.model_dump(by_alias=True) for selection in selections]


async def generate_recommendations(request: RecommendationsRequest) -> dict:
    goals = request.student.career_goals
    interests = request.student.interests

    skills = request.student.skills or []
    query = _build_query(
        goals,
        interests,
        skills,
        study_program=request.student.study_program,
        semester=request.student.semester,
    )
    if not query.strip():
        logger.warning("recommendations | no goals or interests — empty query")
        return {"recommendations": [], "generatedAt": _now()}

    try:
        embeddings = get_embeddings()
        query_vector = await embeddings.aembed_query(query)
    except Exception as e:
        logger.error("recommendations | embedding failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Embedding service unavailable — could not convert query to vector",
        ) from e

    try:
        ensure_schema_initialized(dimensions=get_embedding_dimensions())
        rows = find_similar_courses(
            query_vector=query_vector,
            candidate_ids=[],
            limit=request.limit * 5,
        )
    except OperationalError as e:
        logger.error("recommendations | DB connection failed: %s", e)
        raise HTTPException(
            status_code=503,
            detail="Vector database unavailable — cannot perform similarity search",
        ) from None
    except DatabaseError as e:
        logger.error("recommendations | DB query failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Vector similarity search failed — database query error",
        ) from None

    if not rows:
        logger.warning("recommendations | no embeddings found for candidates")
        return {"recommendations": [], "generatedAt": _now()}

    logger.info("recommendations | found %d retrieved candidates", len(rows))

    candidates: list[tuple[CourseRef, float]] = get_course_refs(rows)

    candidates = _filter_candidates(request, candidates)

    prompt = _build_prompt(request, goals, interests, candidates)

    try:
        llm = get_llm()
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content="Select the best courses for this student and return the JSON array."),
        ]
        result = await llm.ainvoke(messages)
        recommendations = _parse_selections(json.loads(result.content), {c.course_id for c, _ in candidates})
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("recommendations | LLM response invalid: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM returned malformed response — could not parse recommendation list",
        ) from e
    except Exception as e:
        logger.error("recommendations | LLM call failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not generate recommendations",
        ) from e

    return {
        "recommendations": recommendations[: request.limit],
        "generatedAt": _now(),
    }


def _now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")
