import json
import logging
from datetime import UTC, datetime

from llm.embeddings import get_embeddings
from llm.provider import get_llm
from models.recommendations import CourseRef, RecommendationsRequest
from repositories.recommendations import find_similar_courses

logger = logging.getLogger("genai")


def _build_query(goals: list[str], interests: list[str]) -> str:
    return " ".join(goals + interests)


def _build_prompt(
    request: RecommendationsRequest,
    goals: list[str],
    interests: list[str],
    candidates: list[tuple[CourseRef, float]],
) -> str:
    completed_names = [c.course_name for c in request.completed_courses]
    courses_text = "\n".join(
        f"- courseId={c.course_id} | {c.course_name} | score={score:.3f}"
        + (f" | {c.description[:200]}" if c.description else "")
        for c, score in candidates
    )

    return f"""You are an academic advisor at TUM (Technical University of Munich).
Given a student profile and candidate courses pre-ranked by semantic similarity, \
select the {request.limit} most relevant courses and provide a reason and tags for each.

Student profile:
- Study program: {request.student.study_program}
- Semester: {request.student.semester}
- Career goals: {", ".join(goals) or "not specified"}
- Interests: {", ".join(interests) or "not specified"}
- Completed courses: {", ".join(completed_names) or "none"}

Candidate courses (sorted by relevance score):
{courses_text}

Return ONLY a valid JSON array. No explanation, no markdown, just JSON:
[
  {{
    "courseId": <int>,
    "relevanceScore": <float 0-1>,
    "reason": "<1-2 sentence explanation why this course fits the student>",
    "tags": ["<tag1>", "<tag2>"]
  }}
]"""


async def generate_recommendations(request: RecommendationsRequest) -> dict:
    goals = request.override_goals or request.student.career_goals
    interests = request.override_interests or request.student.interests

    query = _build_query(goals, interests)
    if not query.strip():
        logger.warning("recommendations | no goals or interests — empty query")
        return {"recommendations": [], "generatedAt": _now()}

    embeddings = get_embeddings()
    query_vector = await embeddings.aembed_query(query)

    completed_ids = {c.course_id for c in request.completed_courses}
    exclude_ids = set(request.exclude_course_ids or [])
    candidate_ids = [
        c.course_id
        for c in request.available_courses
        if c.course_id not in completed_ids and c.course_id not in exclude_ids
    ]

    rows = find_similar_courses(
        query_vector=query_vector,
        candidate_ids=candidate_ids,
        limit=request.limit * 2,
    )

    if not rows:
        logger.warning("recommendations | no embeddings found for candidates")
        return {"recommendations": [], "generatedAt": _now()}

    course_map = {c.course_id: c for c in request.available_courses}
    candidates = [(course_map[row[0]], row[1]) for row in rows if row[0] in course_map]

    prompt = _build_prompt(request, goals, interests, candidates)
    llm = get_llm()
    result = await llm.ainvoke(prompt)

    recommendations = json.loads(result.content)
    if not isinstance(recommendations, list):
        raise ValueError("LLM returned unexpected structure")

    return {
        "recommendations": recommendations[: request.limit],
        "generatedAt": _now(),
    }


def _now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")
