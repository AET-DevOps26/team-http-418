from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


# TODO: future work
@router.post("/me/transcript/upload")
async def transcript_parse():
    return JSONResponse({"error": "Not implemented"}, status_code=501)
