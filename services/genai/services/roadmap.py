import json
import logging
from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException

from llm.provider import get_llm
from models.roadmap import RoadmapRequest

_ROADMAP_PROMPT = (Path(__file__).parent.parent / "prompts" / "roadmap.txt").read_text()

logger = logging.getLogger("genai")


def _build_prompt(request: RoadmapRequest) -> str:
    student = request.student
    prefs = student.preferences
    max_credits = prefs.max_credits_per_semester if prefs else 30

    categories_text = (
        "\n".join(
            f"  - {cat.name}: {cat.credits_earned}/{cat.credits_required} credits earned"
            for cat in request.degree_requirements.categories
        )
        or "  - (no category breakdown provided)"
    )

    completed_text = (
        "\n".join(f"  - {c.course_code} ({c.credits} credits)" for c in request.completed_courses) or "  none"
    )

    enrolled_text = (
        "\n".join(
            f"  - {c.course_code} ({c.credits} credits, semester {c.semester or 'current'})"
            for c in request.enrolled_courses
        )
        or "  none"
    )

    available_text = (
        "\n".join(
            f"  - courseId={c.course_id} | {c.course_code} | {c.course_name} | {c.credits} credits"
            + (f" | preferred: {c.preferred_semester}" if c.preferred_semester else "")
            for c in request.available_courses
        )
        or "  none"
    )

    return _ROADMAP_PROMPT.format(
        study_program=student.study_program_id or student.study_program or "not specified",
        current_semester=student.semester,
        career_goals=", ".join(student.career_goals) or "not specified",
        interests=", ".join(student.interests) or "not specified",
        max_credits_per_semester=max_credits,
        credits_earned=request.degree_requirements.total_credits_earned,
        credits_required=request.degree_requirements.total_credits_required,
        remaining_semesters=request.degree_requirements.remaining_semesters,
        categories_text=categories_text,
        completed_courses_text=completed_text,
        enrolled_courses_text=enrolled_text,
        available_courses_text=available_text,
    )


async def generate_roadmap(request: RoadmapRequest) -> dict:
    prompt = _build_prompt(request)

    try:
        llm = get_llm()
        result = await llm.ainvoke(prompt)
        parsed = json.loads(result.content)
        if "semesters" not in parsed or not isinstance(parsed["semesters"], list):
            raise ValueError("missing or invalid 'semesters' key")
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("roadmap | LLM response invalid: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM returned malformed response — could not parse roadmap plan",
        ) from e
    except Exception as e:
        logger.error("roadmap | LLM call failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not generate roadmap",
        ) from e

    return {
        "semesters": parsed["semesters"],
        "summary": parsed.get("summary", ""),
        "generatedAt": _now(),
    }


def _now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")
