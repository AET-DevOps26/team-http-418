import logging
import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models.roadmap import RoadmapRequest
from services.roadmap import generate_roadmap

logger = logging.getLogger("genai")

router = APIRouter()


@router.post("/me/roadmap/generate")
async def roadmap_generate(request: RoadmapRequest):
    start = time.perf_counter()
    logger.info(
        "roadmap | program=%s semester=%d available=%d",
        request.student.study_program,
        request.student.semester,
        len(request.available_courses),
    )

    result = await generate_roadmap(request)

    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info(
        "roadmap | semesters=%d duration_ms=%d",
        len(result["semesters"]),
        elapsed_ms,
    )
    return JSONResponse(result)
