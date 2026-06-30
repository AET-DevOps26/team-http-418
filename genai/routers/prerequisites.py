import logging
import time

from fastapi import APIRouter

from models.prerequisites import PrerequisiteExtractRequest, PrerequisiteExtractResponse
from services.prerequisites import extract_prerequisites

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
