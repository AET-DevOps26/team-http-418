import json
import logging

from fastapi import HTTPException

from llm.provider import get_llm
from models.plan_validate import PlanValidateRequest
from prompt_config import get_spec

logger = logging.getLogger("genai")


def _build_prompt(request: PlanValidateRequest) -> str:
    prefs = request.student.preferences

    blocked_slots = ", ".join(f"{s.day} {s.start_time}-{s.end_time}" for s in prefs.blocked_time_slots) or "none"

    courses_text = (
        "\n".join(
            f"  - {c.course_code} | {c.course_name} | {c.credits} ECTS"
            + (
                " | schedule: " + ", ".join(f"{s.day} {s.start_time}-{s.end_time} ({s.type})" for s in c.schedule)
                if c.schedule
                else ""
            )
            for c in request.semester_plan.courses
        )
        or "  none"
    )

    completed = ", ".join(f"{c.course_name} ({c.course_code})" for c in request.completed_courses) or "none"

    return get_spec("plan_validate").render(
        semester=request.student.semester,
        career_goals=", ".join(request.student.career_goals) or "not specified",
        max_credits_per_semester=prefs.max_credits_per_semester,
        prefer_no_back_to_back=prefs.prefer_no_back_to_back,
        blocked_time_slots=blocked_slots,
        semester_key=request.semester_plan.semester_key,
        total_credits=request.semester_plan.total_credits,
        courses_text=courses_text,
        completed_courses=completed,
    )


async def validate_plan(request: PlanValidateRequest) -> dict:
    prompt = _build_prompt(request)

    try:
        llm = get_llm()
        result = await llm.ainvoke(prompt)
        parsed = json.loads(result.content)
        if "warnings" not in parsed or not isinstance(parsed["warnings"], list):
            raise ValueError("missing or invalid 'warnings' key")
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("plan_validate | LLM response invalid: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM returned malformed response — could not parse validation warnings",
        ) from e
    except Exception as e:
        logger.error("plan_validate | LLM call failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not validate plan",
        ) from e

    return {"warnings": parsed["warnings"]}
