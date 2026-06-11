import logging
import time

from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from llm.provider import check_llm_health, get_provider_info, get_llm

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("genai")

app = FastAPI(title="AIDAN GenAI Service")

router = APIRouter(prefix="/v1")


@router.get("/health")
async def health():
    llm_status = check_llm_health()
    provider_info = get_provider_info()
    return JSONResponse({
        "status": "UP",
        "llm": {
            "status": llm_status,
            **provider_info,
        }
    })


# ---------------------------------------------------------------------------
# Implemented endpoints
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str


@router.post("/chat")
async def chat(request: ChatRequest):
    provider_info = get_provider_info()
    # TODO: remove request_body from logs before prod — will contain student data
    logger.info(
        "chat | model=%s provider=%s request_body=%r",
        provider_info["model"],
        provider_info["provider"],
        request.message,
    )

    llm = get_llm()
    start = time.perf_counter()
    result = await llm.ainvoke(request.message)
    elapsed_ms = round((time.perf_counter() - start) * 1000)

    token_usage = getattr(result, "response_metadata", {}).get("token_usage", {})
    logger.info(
        "chat | model=%s duration_ms=%d prompt_tokens=%s completion_tokens=%s total_tokens=%s",
        provider_info["model"],
        elapsed_ms,
        token_usage.get("prompt_tokens", "n/a"),
        token_usage.get("completion_tokens", "n/a"),
        token_usage.get("total_tokens", "n/a"),
    )

    return JSONResponse({"response": result.content})


# ---------------------------------------------------------------------------
# Stub endpoints — returns 501 until implemented
# ---------------------------------------------------------------------------

@router.get("/courses")
async def courses_search():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@router.post("/me/recommendations")
async def recommendations():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@router.post("/me/roadmap/generate")
async def roadmap_generate():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@router.post("/me/advisor/conversations/{conversation_id}/messages")
async def advisor_chat(conversation_id: str):
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@router.post("/me/advisor/suggestions")
async def advisor_suggestions():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@router.post("/me/transcript/upload")
async def transcript_parse():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@router.post("/me/plan/validate")
async def plan_validate():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@router.post("/embeddings/courses")
async def embeddings_courses():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


app.include_router(router)
