from fastapi import FastAPI, APIRouter
from fastapi.responses import JSONResponse

from llm.provider import check_llm_health, get_provider_info

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
