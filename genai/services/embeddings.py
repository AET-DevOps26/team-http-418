import logging

from fastapi import HTTPException
from psycopg2 import DatabaseError, OperationalError

from db import get_connection
from llm.embeddings import get_active_model, get_embeddings
from models.embeddings import EmbedCoursesRequest, EmbedMode

logger = logging.getLogger("genai")


def _build_text(course) -> str:
    parts = [course.course_name]
    if course.description:
        parts.append(course.description)
    if course.department:
        parts.append(course.department)
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
