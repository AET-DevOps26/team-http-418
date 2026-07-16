import json
import logging

from fastapi import HTTPException

from db import ensure_schema_initialized
from llm.embeddings import get_embedding_dimensions, get_embeddings
from llm.provider import get_llm
from models.prerequisites import (
    AvailableCourse,
    PrerequisiteCourseRequest,
    PrerequisiteExtractBatchRequest,
    PrerequisiteExtractRequest,
)
from prompt_config import get_spec
from repositories.recommendations import find_similar_courses
from services.normalize import normalize_prerequisite_nodes

logger = logging.getLogger("genai")


def _build_prompt(
    request: PrerequisiteCourseRequest | PrerequisiteExtractRequest,
    available_courses: list[AvailableCourse],
) -> str:
    available_text = "\n".join(f"  - courseId={c.course_id} | {c.course_name}" for c in available_courses) or "  none"

    return get_spec("prerequisites").render(
        course_name=request.course_name,
        previous_knowledge_text=request.previous_knowledge_text,
        available_courses_text=available_text,
    )


def _empty_tree(course: PrerequisiteCourseRequest | PrerequisiteExtractRequest) -> dict:
    return {
        "courseId": course.course_id,
        "courseCode": str(course.course_id),
        "courseName": course.course_name,
        "prerequisites": [],
    }


def _parse_chunk_response(content: str) -> list[dict]:
    raw = json.loads(content)
    if isinstance(raw, dict):
        raw = raw.get("trees")
    if not isinstance(raw, list) or not all(isinstance(tree, dict) for tree in raw):
        raise ValueError("LLM returned unexpected prerequisite batch structure")
    return raw


async def extract_prerequisites_batch(request: PrerequisiteExtractBatchRequest) -> dict:
    nonblank_courses = [course for course in request.courses if course.previous_knowledge_text.strip()]
    results: dict[int, dict] = {
        course.course_id: _empty_tree(course)
        for course in request.courses
        if not course.previous_knowledge_text.strip()
    }
    if not nonblank_courses:
        return {"trees": [results[course.course_id] for course in request.courses]}

    try:
        embeddings = get_embeddings()
        query_vectors = await embeddings.aembed_documents(
            [course.previous_knowledge_text for course in nonblank_courses]
        )
    except Exception as e:
        logger.error("prerequisites | embedding failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Embedding service unavailable — could not convert previous knowledge to vector",
        ) from e

    available_map = {course.course_id: course for course in request.available_courses}

    try:
        ensure_schema_initialized(dimensions=get_embedding_dimensions())
        candidates_by_course = {
            course.course_id: find_similar_courses(query_vector=query_vector, candidate_ids=[], limit=20)
            for course, query_vector in zip(nonblank_courses, query_vectors, strict=True)
        }
    except Exception as e:
        logger.error("prerequisites | similarity search failed: %s", e)
        # Fallback: if vector search fails, we might want to fail or use all available.
        # Given the "poorly optimized" complaint, failing fast is probably better than blowing up context.
        raise HTTPException(
            status_code=502,
            detail="Vector similarity search failed — database error",
        ) from e

    filtered_available_by_course = {
        course_id: [course for course in request.available_courses if course.course_id in {row[0] for row in rows}]
        for course_id, rows in candidates_by_course.items()
    }
    for course in nonblank_courses:
        if not filtered_available_by_course[course.course_id]:
            results[course.course_id] = _empty_tree(course)
    llm_courses = [course for course in nonblank_courses if filtered_available_by_course[course.course_id]]
    if not llm_courses:
        return {"trees": [results[course.course_id] for course in request.courses]}

    try:
        llm = get_llm()
        for offset in range(0, len(llm_courses), 10):
            chunk = llm_courses[offset : offset + 10]
            prompts = "\n\n".join(
                _build_prompt(course, filtered_available_by_course[course.course_id]) for course in chunk
            )
            target_ids = ", ".join(str(course.course_id) for course in chunk)
            prompt = get_spec("prerequisites_batch").render(
                target_ids=target_ids,
                prompts=prompts,
            )
            result = await llm.ainvoke(prompt)
            raw_trees = _parse_chunk_response(result.content)
            if len(raw_trees) != len(chunk):
                raise ValueError("LLM returned an incomplete prerequisite batch")
            for course, raw_tree in zip(chunk, raw_trees, strict=True):
                if raw_tree.get("courseId") != course.course_id:
                    raise ValueError("LLM returned prerequisite trees in an unexpected order")
                raw_prerequisites = raw_tree.get("prerequisites")
                if not isinstance(raw_prerequisites, list):
                    raise ValueError("LLM returned a tree without prerequisites")
                results[course.course_id] = {
                    **_empty_tree(course),
                    "prerequisites": normalize_prerequisite_nodes(raw_prerequisites, available_map),
                }
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("prerequisites | LLM response invalid: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM returned malformed response — could not parse prerequisite batch",
        ) from e
    except Exception as e:
        logger.error("prerequisites | LLM call failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not extract prerequisites",
        ) from e

    return {"trees": [results[course.course_id] for course in request.courses]}


async def extract_prerequisites(request: PrerequisiteExtractRequest) -> dict:
    result = await extract_prerequisites_batch(
        PrerequisiteExtractBatchRequest(
            courses=[
                PrerequisiteCourseRequest(
                    courseId=request.course_id,
                    courseName=request.course_name,
                    previousKnowledgeText=request.previous_knowledge_text,
                )
            ],
            availableCourses=request.available_courses,
        )
    )
    return result["trees"][0]
