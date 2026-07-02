from fastapi import APIRouter, Request

from services.cv import parse_cv

router = APIRouter()


@router.post("/cv/parse")
async def cv_parse(request: Request):
    pdf_bytes = await request.body()
    if not pdf_bytes:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Request body is empty")
    return await parse_cv(pdf_bytes)
