from fastapi import APIRouter, HTTPException, Request

from services.cv import parse_cv

router = APIRouter()

_MAX_UPLOAD_BYTES = 10 * 1024 * 1024


@router.post("/cv/parse")
async def cv_parse(request: Request):
    pdf_bytes = await request.body()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Request body is empty")
    if len(pdf_bytes) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds 10 MB limit")
    return await parse_cv(pdf_bytes)
