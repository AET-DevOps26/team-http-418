import logging
import time

from fastapi import APIRouter

from models.prerequisites import (
    PrerequisiteExtractBatchRequest,
    PrerequisiteExtractBatchResponse,
    PrerequisiteExtractRequest,
    PrerequisiteExtractResponse,
)
from services.prerequisites import extract_prerequisites, extract_prerequisites_batch

logger = logging.getLogger("genai")

router = APIRouter()


@router.post("/prerequisites/extract", response_model=PrerequisiteExtractResponse)
async def prerequisites_extract(request: PrerequisiteExtractRequest):
    start = time.perf_counter()
    logger.info(
        "prerequisites | course_id=%d courses_available=%d",
        request.course_id,
        len(request.available_courses),
    )

    result = await extract_prerequisites(request)

    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info(
        "prerequisites | returned=%d duration_ms=%d",
        len(result["prerequisites"]),
        elapsed_ms,
    )
    return result


@router.post("/prerequisites/extract/batch", response_model=PrerequisiteExtractBatchResponse)
async def prerequisites_extract_batch(request: PrerequisiteExtractBatchRequest):
    start = time.perf_counter()
    logger.info(
        "prerequisites batch | courses=%d courses_available=%d",
        len(request.courses),
        len(request.available_courses),
    )
    result = await extract_prerequisites_batch(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info("prerequisites batch | returned=%d duration_ms=%d", len(result["trees"]), elapsed_ms)
    return result
