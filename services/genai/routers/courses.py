import logging
import time

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from services.courses import semantic_search

logger = logging.getLogger("genai")

router = APIRouter()


@router.get("/courses")
async def courses_search(
    query: str = Query(..., description="Natural language search query"),
    limit: int = Query(20, ge=1, le=100),
    department: str | None = Query(None),
    language: str | None = Query(None),
    level: str | None = Query(None),
):
    start = time.perf_counter()
    result = await semantic_search(query=query, limit=limit)
    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info("search | results=%d duration_ms=%d", len(result["results"]), elapsed_ms)
    return JSONResponse(result)
