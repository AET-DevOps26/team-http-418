import logging
import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models.chat import ChatRequest
from services.chat import chat

logger = logging.getLogger("genai")

router = APIRouter()


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    start = time.perf_counter()
    result = await chat(request.message)
    elapsed_ms = round((time.perf_counter() - start) * 1000)
    logger.info("chat | duration_ms=%d", elapsed_ms)
    return JSONResponse(result)
