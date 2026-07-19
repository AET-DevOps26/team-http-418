import json
import logging

from fastapi import HTTPException

from llm.provider import get_llm
from models.advisor import AdvisorPromptSuggestionsRequest
from prompt_config import get_spec

logger = logging.getLogger("genai")


def _build_prompt(request: AdvisorPromptSuggestionsRequest) -> str:
    student = request.student
    completed = ", ".join(f"{c.course_name} ({c.course_code})" for c in request.completed_courses) or "none"
    return get_spec("suggestions").render(
        study_program=student.study_program,
        semester=student.semester,
        current_semester=request.current_semester or "not specified",
        career_goals=", ".join(student.career_goals) or "not specified",
        interests=", ".join(student.interests) or "not specified",
        credits_earned=student.total_credits_earned,
        credits_required=student.total_credits_required,
        completed_courses=completed,
    )


async def generate_suggestions(request: AdvisorPromptSuggestionsRequest) -> list[dict]:
    prompt = _build_prompt(request)

    try:
        llm = get_llm()
        result = await llm.ainvoke(prompt)
        parsed = json.loads(result.content)
        if not isinstance(parsed, list):
            raise ValueError("LLM returned unexpected structure — expected JSON array")
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("suggestions | LLM response invalid: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM returned malformed response — could not parse suggestion chips",
        ) from e
    except Exception as e:
        logger.error("suggestions | LLM call failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not generate suggestions",
        ) from e

    return parsed
