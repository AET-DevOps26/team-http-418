import logging

from fastapi import HTTPException
from psycopg2 import DatabaseError, OperationalError

from db import ensure_schema_initialized
from llm.embeddings import get_active_model, get_embedding_dimensions, get_embeddings
from repositories.courses import search_courses

logger = logging.getLogger("genai")


async def semantic_search(query: str, limit: int) -> list[dict]:
    model = get_active_model()
    logger.info("search | model=%s query=%r limit=%d", model, query, limit)

    try:
        embeddings = get_embeddings()
        query_vector = await embeddings.aembed_query(query)
    except Exception as e:
        logger.error("search | model=%s embedding failed: %s", model, e)
        raise HTTPException(
            status_code=502,
            detail="Embedding service unavailable — could not convert query to vector",
        ) from e

    try:
        ensure_schema_initialized(dimensions=get_embedding_dimensions())
        rows = search_courses(query_vector=query_vector, limit=limit)
    except OperationalError as e:
        logger.error("search | model=%s DB connection failed: %s", model, e)
        raise HTTPException(
            status_code=503,
            detail="Vector database unavailable — cannot perform similarity search",
        ) from None
    except DatabaseError as e:
        logger.error("search | model=%s DB query failed: %s", model, e)
        raise HTTPException(
            status_code=502,
            detail="Vector similarity search failed — database query error",
        ) from None

    results = [{"courseId": row[0], "score": round(row[1], 4)} for row in rows]
    logger.info("search | model=%s results=%d", model, len(results))
    return results
