import logging

from fastapi import HTTPException
from psycopg2 import DatabaseError, OperationalError

from db import ensure_schema_initialized, get_connection
from llm.embeddings import get_active_model, get_embedding_dimensions, get_embeddings
from models.embeddings import CourseItem, EmbedCoursesRequest, EmbedMode

logger = logging.getLogger("genai")


def _is_duplicate(en: str | None, ger: str | None) -> bool:
    if not en or not ger:
        return False
    return en.strip().lower() == ger.strip().lower()


def _build_text(course: CourseItem) -> str:
    parts = [f"Title: {course.title_en}"]

    if course.title_ger and not _is_duplicate(course.title_en, course.title_ger):
        parts.append(f"Title (DE): {course.title_ger}")

    if course.description_en and not _is_duplicate(course.description_en, course.description_ger):
        parts.append(f"Description: {course.description_en}")
    elif course.description_ger:
        parts.append(f"Description [German]: {course.description_ger}")

    if (
        course.description_ger
        and course.description_en
        and not _is_duplicate(course.description_en, course.description_ger)
    ):
        parts.append(f"Description (DE): {course.description_ger}")

    if course.course_objective_en and not _is_duplicate(course.course_objective_en, course.course_objective_ger):
        parts.append(f"Objectives: {course.course_objective_en}")
    elif course.course_objective_ger:
        parts.append(f"Objectives [German]: {course.course_objective_ger}")

    if course.previous_knowledge_en and not _is_duplicate(course.previous_knowledge_en, course.previous_knowledge_ger):
        parts.append(f"Prerequisites: {course.previous_knowledge_en}")
    elif course.previous_knowledge_ger:
        parts.append(f"Prerequisites [German]: {course.previous_knowledge_ger}")

    if course.department:
        parts.append(f"Department: {course.department}")

    return " | ".join(parts)


async def embed_courses(request: EmbedCoursesRequest) -> dict:
    model = get_active_model()
    total = len(request.courses)
    logger.info("embed | model=%s mode=%s courses=%d", model, request.mode, total)

    texts = [_build_text(course) for course in request.courses]

    try:
        embeddings = get_embeddings()
        vectors = await embeddings.aembed_documents(texts)
    except Exception as e:
        logger.error("embed | model=%s embedding failed: %s", model, e)
        raise HTTPException(
            status_code=502,
            detail="Embedding service unavailable — could not embed course descriptions",
        ) from e

    rows = [(course.course_id, vector) for course, vector in zip(request.courses, vectors, strict=False)]

    try:
        ensure_schema_initialized(dimensions=get_embedding_dimensions())
        with get_connection() as connection, connection.cursor() as cursor:
            if request.mode == EmbedMode.FULL_REBUILD:
                cursor.execute("DELETE FROM course_embeddings")
                logger.info("embed | full rebuild — deleted existing embeddings")
            cursor.executemany(
                """
                INSERT INTO course_embeddings (course_id, embedding, updated_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (course_id) DO UPDATE
                    SET embedding = EXCLUDED.embedding,
                        updated_at = NOW()
                """,
                rows,
            )
            connection.commit()
    except OperationalError as e:
        logger.error("embed | model=%s DB connection failed: %s", model, e)
        raise HTTPException(
            status_code=503,
            detail="Vector database unavailable — could not store embeddings",
        ) from None
    except DatabaseError as e:
        logger.error("embed | model=%s DB query failed: %s", model, e)
        raise HTTPException(
            status_code=502,
            detail="Database error — embedding upsert failed",
        ) from None

    logger.info("embed | model=%s embedded=%d", model, total)
    return {"embedded": total, "skipped": 0, "failed": 0, "errors": []}
