import json
import logging
import os
from collections.abc import AsyncGenerator

from fastapi import HTTPException
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from llm.embeddings import get_embeddings
from llm.provider import get_llm
from models.advisor import AdvisorRequest, CompletedCourseRef, MessageRole
from models.recommendations import CourseRef
from prompt_config import get_spec
from repositories.courses import get_course_refs
from repositories.recommendations import find_similar_courses

logger = logging.getLogger("genai")

ADVISOR_CONTEXT_WINDOW = int(os.getenv("ADVISOR_CONTEXT_WINDOW", "10"))


def _format_completed_courses(courses: list) -> str:
    if not courses:
        return "none"
    parts = []
    for c in courses:
        if isinstance(c, CompletedCourseRef):
            parts.append(f"{c.course_name} ({c.course_code}, {c.credits} ECTS)")
        else:
            parts.append(str(c))
    return ", ".join(parts)


def _build_messages(request: AdvisorRequest) -> list:
    completed_text = _format_completed_courses(request.completed_courses)
    enrolled_text = ", ".join(request.enrolled_courses) if request.enrolled_courses else "none"

    system_prompt = get_spec("advisor").render(
        study_program=request.student.study_program or "not specified",
        semester=request.student.semester or "not specified",
        career_goals=", ".join(request.student.career_goals) or "not specified",
        interests=", ".join(request.student.interests) or "not specified",
        credits_earned=request.student.total_credits_earned
        if request.student.total_credits_earned is not None
        else "not specified",
        credits_required=request.student.total_credits_required
        if request.student.total_credits_required is not None
        else "not specified",
        completed_courses=completed_text,
        enrolled_courses=enrolled_text,
    )

    messages: list = [SystemMessage(content=system_prompt)]

    for msg in request.conversation_history[-ADVISOR_CONTEXT_WINDOW:]:
        if msg.role == MessageRole.USER:
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    messages.append(HumanMessage(content=request.new_message))
    return messages


def _append_course_context(messages: list, courses: list[tuple[CourseRef, float]]) -> list:
    """Attach retrieval results in one place so production and golden evals share it."""
    courses_text = "\n".join(
        f"- courseId={course.course_id} | {course.course_name} | score={score:.3f}"
        + (f" | {course.description}" if course.description else "")
        for course, score in courses
    )
    if courses_text:
        messages.append(SystemMessage(content=get_spec("advisor_rag_has_data").render(courses_text=courses_text)))
    else:
        messages.append(SystemMessage(content=get_spec("advisor_rag_no_data").render()))
    return messages


async def do_thinking(messages, study_program_id: int):
    """
    allows the model to do a semantic search for courses
    """
    llm = get_llm()
    result = await llm.ainvoke(messages)
    messages.append(AIMessage(content=result.content))
    logger.info("advisor | LLM response: %s", result.content)
    try:
        llm_query: dict = json.loads(result.content)
        assert isinstance(llm_query, dict)
        logger.info("advisor | LLM query: %s", llm_query)
    except Exception as e:
        logger.warning("advisor | LLM query failed: %s", e)
        llm_query = {}

    course_ids: list[tuple[int, float]] = []
    courses: list[tuple[CourseRef, float]] = []
    if llm_query.get("isQuery") and llm_query.get("query"):
        try:
            embeddings = get_embeddings()
            query_vector = await embeddings.aembed_query(llm_query.get("query"))
            course_ids = find_similar_courses(query_vector, [], 30, study_program_id)
            logger.info("advisor | fournd %d courses", len(course_ids))
        except Exception as e:
            logger.warning("advisor | semantic search failed: %s", e)
        courses = get_course_refs(course_ids)

    _append_course_context(messages, courses)
    logger.info("advisor | messages_count=%d", len(messages))
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
        messages = await do_thinking(messages, request.student.study_program_id)
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
        messages = await do_thinking(messages, request.student.study_program_id)
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
