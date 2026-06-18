from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


# TODO: implement these endpoints instead of stubs
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
