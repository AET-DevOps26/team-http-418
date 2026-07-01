import logging
import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models.embeddings import EmbedCoursesRequest
from services.embeddings import embed_courses

logger = logging.getLogger("genai")

router = APIRouter()


# TODO: connect with scraper — scraper should call this endpoint after ingestion
@router.post("/embeddings/courses")
async def embeddings_courses(request: EmbedCoursesRequest):
    start = time.perf_counter()
    result = await embed_courses(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info("embed | embedded=%d duration_ms=%d", result["embedded"], elapsed_ms)
    return JSONResponse(result)
