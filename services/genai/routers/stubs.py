from fastapi import APIRouter
from fastapi.responses import JSONResponse

from models.transcript import TranscriptMatchRequest
from services.transcript import match_transcript_modules

router = APIRouter()


# TODO: implement these endpoints instead of stubs
@router.post("/me/roadmap/generate")
async def roadmap_generate():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@router.post("/transcript/match")
async def transcript_match(request: TranscriptMatchRequest):
    return match_transcript_modules(request)
