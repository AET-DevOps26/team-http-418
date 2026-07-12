from fastapi import APIRouter

from models.transcript import TranscriptMatchRequest
from services.transcript import match_transcript_modules

router = APIRouter()


@router.post("/transcript/match")
async def transcript_match(request: TranscriptMatchRequest):
    return match_transcript_modules(request)
