import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from db import init_schema
from llm.embeddings import get_embedding_dimensions
from llm.provider import get_provider_info
from routers import (
    advisor,
    chat,
    courses,
    embeddings,
    plan_validate,
    prerequisites,
    recommendations,
    roadmap,
    stubs,
    suggestions,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("genai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_schema(dimensions=get_embedding_dimensions())
    yield


app = FastAPI(title="AIDAN GenAI Service", lifespan=lifespan)

router = APIRouter(prefix="/v1")


@router.get("/health")
async def health():
    provider_info = get_provider_info()
    return JSONResponse({"status": "UP", "llm": provider_info})


app.include_router(router)
app.include_router(advisor.router, prefix="/v1")
app.include_router(chat.router, prefix="/v1")
app.include_router(courses.router, prefix="/v1")
app.include_router(embeddings.router, prefix="/v1")
app.include_router(recommendations.router, prefix="/v1")
app.include_router(plan_validate.router, prefix="/v1")
app.include_router(suggestions.router, prefix="/v1")
app.include_router(prerequisites.router, prefix="/v1")
app.include_router(roadmap.router, prefix="/v1")
app.include_router(stubs.router, prefix="/v1")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # 1. Extract details about the request
    body = await request.body()
    decoded_body = body.decode("utf-8") if body else "Empty Body"

    # 2. Log the exact validation errors and payload
    logger.error(
        "422 Unprocessable Content Error!\n"
        "URL: %s %s\n"
        "Errors: %s\n"
        "Payload received: %s",
        request.method,
        request.url,
        exc.errors(),  # This contains exactly which field failed and why
        decoded_body
    )
