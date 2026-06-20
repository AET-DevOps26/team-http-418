import logging
import time

from fastapi import APIRouter

from models.plan_validate import PlanValidateRequest, PlanValidateResponse
from services.plan_validate import validate_plan

logger = logging.getLogger("genai")

router = APIRouter()


@router.post("/me/plan/validate", response_model=PlanValidateResponse)
async def plan_validate(request: PlanValidateRequest):
    start = time.perf_counter()
    logger.info(
        "plan_validate | semester_key=%s total_credits=%d courses=%d",
        request.semester_plan.semester_key,
        request.semester_plan.total_credits,
        len(request.semester_plan.courses),
    )

    result = await validate_plan(request)

    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info(
        "plan_validate | warnings=%d duration_ms=%d",
        len(result["warnings"]),
        elapsed_ms,
    )
    return result
