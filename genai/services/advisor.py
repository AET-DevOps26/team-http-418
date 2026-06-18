import json
import logging
import os
from collections.abc import AsyncGenerator
from pathlib import Path

from fastapi import HTTPException
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from llm.provider import get_llm
from models.advisor import AdvisorRequest, MessageRole

logger = logging.getLogger("genai")

ADVISOR_CONTEXT_WINDOW = int(os.getenv("ADVISOR_CONTEXT_WINDOW", "10"))

_ADVISOR_PROMPT = (Path(__file__).parent.parent / "prompts" / "advisor.txt").read_text()


def _build_messages(request: AdvisorRequest) -> list:
    completed = ", ".join(f"{c.course_name} ({c.course_code})" for c in request.completed_courses) or "none"

    system_prompt = _ADVISOR_PROMPT.format(
        study_program=request.student.study_program,
        semester=request.student.semester,
        career_goals=", ".join(request.student.career_goals) or "not specified",
        interests=", ".join(request.student.interests) or "not specified",
        credits_earned=request.student.total_credits_earned,
        credits_required=request.student.total_credits_required,
        completed_courses=completed,
    )

    messages: list = [SystemMessage(content=system_prompt)]

    for msg in request.conversation_history[-ADVISOR_CONTEXT_WINDOW:]:
        if msg.role == MessageRole.USER:
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    messages.append(HumanMessage(content=request.new_message))
    return messages


async def stream_advisor_response(request: AdvisorRequest, conversation_id: str) -> AsyncGenerator[str]:
    try:
        llm = get_llm()
        messages = _build_messages(request)
    except Exception as e:
        logger.error("advisor | conversation_id=%s setup failed: %s", conversation_id, e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not start advisor session",
        ) from e

    full_content = ""
    try:
        async for chunk in llm.astream(messages):
            token = chunk.content
            if token:
                full_content += token
                yield f"data: {json.dumps({'token': token})}\n\n"
    except Exception as e:
        logger.error("advisor | conversation_id=%s stream error: %s", conversation_id, e)
        yield f"data: {json.dumps({'error': 'Stream interrupted'})}\n\n"
        return

    yield f"data: {json.dumps({'done': True, 'fullContent': full_content})}\n\n"


async def get_advisor_response(request: AdvisorRequest) -> dict:
    try:
        llm = get_llm()
        messages = _build_messages(request)
        result = await llm.ainvoke(messages)
        return {"content": result.content, "referencedCourses": []}
    except TimeoutError as e:
        logger.error("advisor | LLM timeout: %s", e)
        raise HTTPException(
            status_code=504,
            detail="LLM request timed out — try again later",
        ) from e
    except Exception as e:
        logger.error("advisor | LLM call failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not generate advisor response",
        ) from e
