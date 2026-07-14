import json
import logging
from pathlib import Path

from fastapi import HTTPException

from db import ensure_schema_initialized
from llm.embeddings import get_embedding_dimensions, get_embeddings
from llm.provider import get_llm
from models.prerequisites import PrerequisiteExtractRequest
from repositories.recommendations import find_similar_courses
from services.normalize import normalize_prerequisite_nodes

_PREREQUISITES_PROMPT = (Path(__file__).parent.parent / "prompts" / "prerequisites.txt").read_text()

logger = logging.getLogger("genai")


def _build_prompt(request: PrerequisiteExtractRequest) -> str:
    available_text = (
        "\n".join(f"  - courseId={c.course_id} | {c.course_name}" for c in request.available_courses) or "  none"
    )

    return _PREREQUISITES_PROMPT.format(
        course_name=request.course_name,
        previous_knowledge_text=request.previous_knowledge_text,
        available_courses_text=available_text,
    )


async def extract_prerequisites(request: PrerequisiteExtractRequest) -> dict:
    if not request.previous_knowledge_text.strip():
        return {
            "courseId": request.course_id,
            "courseCode": str(request.course_id),
            "courseName": request.course_name,
            "prerequisites": [],
        }

    try:
        embeddings = get_embeddings()
        query_vector = await embeddings.aembed_query(request.previous_knowledge_text)
    except Exception as e:
        logger.error("prerequisites | embedding failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Embedding service unavailable — could not convert previous knowledge to vector",
        ) from e

    available_map = {c.course_id: c for c in request.available_courses}

    try:
        ensure_schema_initialized(dimensions=get_embedding_dimensions())
        rows = find_similar_courses(
            query_vector=query_vector,
            candidate_ids=[],
            limit=20,  # Top 20 candidates
        )
    except Exception as e:
        logger.error("prerequisites | similarity search failed: %s", e)
        # Fallback: if vector search fails, we might want to fail or use all available.
        # Given the "poorly optimized" complaint, failing fast is probably better than blowing up context.
        raise HTTPException(
            status_code=502,
            detail="Vector similarity search failed — database error",
        ) from e

    if not rows:
        logger.warning("prerequisites | no similar courses found")
        filtered_available_courses = []
    else:
        candidate_ids_retrieved = {row[0] for row in rows}
        filtered_available_courses = [c for c in request.available_courses if c.course_id in candidate_ids_retrieved]

    # Temporarily swap available_courses for prompt building
    _original_available = request.available_courses
    request.available_courses = filtered_available_courses

    prompt = _build_prompt(request)
    logger.info("prerequisites | prompt=%s", prompt)

    try:
        llm = get_llm()
        result = await llm.ainvoke(prompt)
        logger.info("prerequisites | result=%s", result)
        raw = json.loads(result.content)
        if not isinstance(raw, list):
            raise ValueError("LLM returned unexpected structure")
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("prerequisites | LLM response invalid: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM returned malformed response — could not parse prerequisite list",
        ) from e
    except Exception as e:
        logger.error("prerequisites | LLM call failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not extract prerequisites",
        ) from e

    # Restore or use the map to normalize
    prerequisites = normalize_prerequisite_nodes(raw, available_map)

    return {
        "courseId": request.course_id,
        "courseCode": str(request.course_id),
        "courseName": request.course_name,
        "prerequisites": prerequisites,
    }
