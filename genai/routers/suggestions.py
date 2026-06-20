import logging
import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models.advisor import AdvisorPromptSuggestionsRequest
from services.suggestions import generate_suggestions

logger = logging.getLogger("genai")

router = APIRouter()


@router.post("/me/advisor/suggestions")
async def advisor_suggestions(request: AdvisorPromptSuggestionsRequest):
    start = time.perf_counter()
    logger.info(
        "suggestions | program=%s semester=%d",
        request.student.study_program,
        request.student.semester,
    )

    chips = await generate_suggestions(request)

    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info(
        "suggestions | chips=%d duration_ms=%d",
        len(chips),
        elapsed_ms,
    )
    return JSONResponse(chips)
