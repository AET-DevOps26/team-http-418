import logging
import time

from fastapi import APIRouter

from models.recommendations import RecommendationsRequest, RecommendationsResponse
from services.recommendations import generate_recommendations

logger = logging.getLogger("genai")

router = APIRouter()


@router.post("/me/recommendations", response_model=RecommendationsResponse)
async def recommendations(request: RecommendationsRequest):
    start = time.perf_counter()
    logger.info(
        "recommendations | program=%s semester=%d courses_available=%d",
        request.student.study_program,
        request.student.semester,
        len(request.available_courses),
    )

    result = await generate_recommendations(request)

    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info(
        "recommendations | returned=%d duration_ms=%d",
        len(result["recommendations"]),
        elapsed_ms,
    )
    return result
