import json
import logging
from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException
from psycopg2 import DatabaseError, OperationalError

from db import ensure_schema_initialized
from llm.embeddings import get_embedding_dimensions, get_embeddings
from llm.provider import get_llm
from models.recommendations import CourseRef, RecommendationsRequest
from repositories.recommendations import find_similar_courses

_RECOMMENDATIONS_PROMPT = (Path(__file__).parent.parent / "prompts" / "recommendations.txt").read_text()

logger = logging.getLogger("genai")


def _build_query(goals: list[str], interests: list[str], skills: list[str] | None = None) -> str:
    return " ".join(goals + interests + (skills or []))


def _build_prompt(
    request: RecommendationsRequest,
    goals: list[str],
    interests: list[str],
    candidates: list[tuple[CourseRef, float]],
) -> str:
    completed_names = [course.course_name for course in request.completed_courses]
    courses_text = "\n".join(
        f"- courseId={course.course_id} | {course.course_name} | score={score:.3f}"
        + (f" | {course.description[:200]}" if course.description else "")
        for course, score in candidates
    )

    skills = request.student.skills or []
    cv_lines = []
    if request.student.industry_preference:
        cv_lines.append(f"- Industry preference: {request.student.industry_preference}")
    if request.student.role_preference:
        cv_lines.append(f"- Role preference: {request.student.role_preference}")
    if request.student.cv_data:
        cv_skills = request.student.cv_data.get("skills", [])
        if cv_skills:
            cv_lines.append(f"- CV skills: {', '.join(cv_skills[:20])}")
        work_exp = request.student.cv_data.get("workExperience", [])
        if work_exp:
            roles = [f"{w.get('role', '')} at {w.get('company', '')}" for w in work_exp[:3]]
            cv_lines.append(f"- Work experience: {'; '.join(roles)}")
    cv_context = ("\n" + "\n".join(cv_lines) + "\n") if cv_lines else ""

    return _RECOMMENDATIONS_PROMPT.format(
        limit=request.limit,
        study_program=request.student.study_program or "not specified",
        semester=request.student.semester,
        goals=", ".join(goals) or "not specified",
        interests=", ".join(interests) or "not specified",
        skills=", ".join(skills) or "not specified",
        completed_names=", ".join(completed_names) or "none",
        courses_text=courses_text,
        cv_context=cv_context,
    )


async def generate_recommendations(request: RecommendationsRequest) -> dict:
    goals = request.override_goals or request.student.career_goals
    interests = request.override_interests or request.student.interests

    skills = request.student.skills or []
    query = _build_query(goals, interests, skills)
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

    completed_ids = {course.course_id for course in request.completed_courses}
    exclude_ids = set(request.exclude_course_ids or [])
    candidate_ids = [
        course.course_id
        for course in request.available_courses
        if course.course_id not in completed_ids and course.course_id not in exclude_ids
    ]

    try:
        ensure_schema_initialized(dimensions=get_embedding_dimensions())
        rows = find_similar_courses(
            query_vector=query_vector,
            candidate_ids=candidate_ids,
            limit=request.limit * 3,
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

    course_map = {course.course_id: course for course in request.available_courses}
    candidates = [(course_map[row[0]], row[1]) for row in rows if row[0] in course_map]

    prompt = _build_prompt(request, goals, interests, candidates)

    try:
        llm = get_llm()
        result = await llm.ainvoke(prompt)
        recommendations = json.loads(result.content)
        if not isinstance(recommendations, list):
            raise ValueError("LLM returned unexpected structure")
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
