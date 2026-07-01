import logging
import time

from fastapi import APIRouter, Header
from fastapi.responses import StreamingResponse

from models.advisor import AdvisorRequest, AdvisorResponse
from services.advisor import get_advisor_response, stream_advisor_response

logger = logging.getLogger("genai")

router = APIRouter()


@router.post("/me/advisor/conversations/{conversation_id}/messages")
async def advisor_chat(
    conversation_id: str,
    request: AdvisorRequest,
    accept: str = Header(default="*/*"),
):
    start = time.perf_counter()
    logger.info(
        "advisor | conversation_id=%s history=%d",
        conversation_id,
        len(request.conversation_history),
    )

    if "application/json" in accept:
        result = await get_advisor_response(request)
        elapsed_ms = round((time.perf_counter() - start) * 1000)
        logger.info("advisor | conversation_id=%s duration_ms=%d (sync)", conversation_id, elapsed_ms)
        return AdvisorResponse(**result)

    return StreamingResponse(
        stream_advisor_response(request, conversation_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
