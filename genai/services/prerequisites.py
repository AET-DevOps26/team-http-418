import json
import logging
from pathlib import Path

from fastapi import HTTPException

from llm.provider import get_llm
from models.prerequisites import PrerequisiteExtractRequest

_PREREQUISITES_PROMPT = (Path(__file__).parent.parent / "prompts" / "prerequisites.txt").read_text()

logger = logging.getLogger("genai")


def _build_prompt(request: PrerequisiteExtractRequest) -> str:
    available_text = (
        "\n".join(f"  - courseId={c.course_id} | {c.course_name}" for c in request.available_courses)
        or "  none"
    )

    return _PREREQUISITES_PROMPT.format(
        course_name=request.course_name,
        previous_knowledge_text=request.previous_knowledge_text,
        available_courses_text=available_text,
    )


async def extract_prerequisites(request: PrerequisiteExtractRequest) -> dict:
    if not request.previous_knowledge_text.strip():
        return {
            "courseId": request.course_id,
            "courseCode": str(request.course_id),
            "courseName": request.course_name,
            "prerequisites": [],
        }

    available_map = {c.course_id: c for c in request.available_courses}
    prompt = _build_prompt(request)

    try:
        llm = get_llm()
        result = await llm.ainvoke(prompt)
        raw = json.loads(result.content)
        if not isinstance(raw, list):
            raise ValueError("LLM returned unexpected structure")
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("prerequisites | LLM response invalid: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM returned malformed response — could not parse prerequisite list",
        ) from e
    except Exception as e:
        logger.error("prerequisites | LLM call failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not extract prerequisites",
        ) from e

    prerequisites = []
    for item in raw:
        course_id = item.get("courseId")
        if course_id not in available_map:
            continue
        course = available_map[course_id]
        prerequisites.append({
            "courseId": course_id,
            "courseCode": str(course_id),
            "courseName": course.course_name,
            "type": item.get("type", "RECOMMENDED"),
            "prerequisites": [],
        })

    return {
        "courseId": request.course_id,
        "courseCode": str(request.course_id),
        "courseName": request.course_name,
        "prerequisites": prerequisites,
    }
