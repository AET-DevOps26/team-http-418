import json
import logging
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path

from fastapi import HTTPException
from langchain_core.messages import HumanMessage, SystemMessage

from llm.provider import get_llm
from models.roadmap import RoadmapGeneration, RoadmapRequest

_ROADMAP_PROMPT = (Path(__file__).parent.parent / "prompts" / "roadmap.txt").read_text()

logger = logging.getLogger("genai")


def _build_messages(request: RoadmapRequest) -> list:
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
        "\n".join(
            f"  - {c.course_code} | {c.course_name or c.course_code} ({c.credits} credits)"
            for c in request.completed_courses
        )
        or "  none"
    )

    enrolled_text = (
        "\n".join(
            f"  - {c.course_code} ({c.credits} credits, semester {c.semester or 'current'})"
            for c in request.enrolled_courses
        )
        or "  none"
    )

    courses_by_category: dict[str, list] = defaultdict(list)
    for c in request.available_courses:
        category = c.category if hasattr(c, "category") and c.category else "Uncategorized"
        line = f"  - courseId={c.course_id} | {c.course_code} | {c.course_name} | {c.credits} ECTS"
        if c.preferred_semester:
            line += f" | offered: {c.preferred_semester}"
        if c.has_prerequisites:
            line += " | has prerequisites"
        courses_by_category[category].append(line)

    if courses_by_category:
        available_parts = []
        for category, courses in courses_by_category.items():
            available_parts.append(f"\n  [{category}]")
            available_parts.extend(courses)
        available_text = "\n".join(available_parts)
    else:
        available_text = "  none"

    system_content = _ROADMAP_PROMPT.format(
        study_program=student.study_program or "not specified",
        current_semester=request.current_semester_key,
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

    return [
        SystemMessage(content=system_content),
        HumanMessage(content="Generate my semester-by-semester course plan."),
    ]


async def generate_roadmap(request: RoadmapRequest) -> dict:
    messages = _build_messages(request)

    try:
        llm = get_llm()
        result = await llm.ainvoke(messages)
        parsed = RoadmapGeneration.model_validate(json.loads(result.content)).model_dump(by_alias=True)
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
