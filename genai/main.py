import logging
import time
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from db import get_connection, init_schema
from llm.embeddings import get_active_model, get_embedding_dimensions, get_embeddings
from llm.provider import check_llm_health, get_llm, get_provider_info

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
    llm_status = check_llm_health()
    provider_info = get_provider_info()
    return JSONResponse(
        {
            "status": "UP",
            "llm": {
                "status": llm_status,
                **provider_info,
            },
        }
    )


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

    try:
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

    except TimeoutError as e:
        logger.error("chat | model=%s timeout: %s", provider_info["model"], e)
        return JSONResponse({"error": "LLM request timed out"}, status_code=504)
    except Exception as e:
        logger.error("chat | model=%s unexpected error: %s", provider_info["model"], e)
        return JSONResponse({"error": "LLM request failed"}, status_code=502)


# ---------------------------------------------------------------------------
# Stub endpoints — returns 501 until implemented
# ---------------------------------------------------------------------------


@router.get("/courses")
async def courses_search(
    query: str = Query(..., description="Natural language search query"),
    limit: int = Query(20, ge=1, le=100),
    department: str | None = Query(None),
    language: str | None = Query(None),
    level: str | None = Query(None),
):
    model = get_active_model()
    logger.info("search | model=%s query=%r limit=%d", model, query, limit)
    start = time.perf_counter()

    try:
        embeddings = get_embeddings()
        query_vector = await embeddings.aembed_query(query)

        with get_connection() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT course_id,
                       1 - (embedding <=> %s::vector) AS score
                FROM course_embeddings
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_vector, query_vector, limit),
            )
            rows = cur.fetchall()

        results = [{"courseId": row[0], "score": round(row[1], 4)} for row in rows]
        elapsed_ms = round((time.perf_counter() - start) * 1000)
        logger.info("search | model=%s results=%d duration_ms=%d", model, len(results), elapsed_ms)

        return JSONResponse({"results": results})

    except Exception as e:
        logger.error("search | model=%s error: %s", model, e)
        return JSONResponse({"error": "Search failed"}, status_code=502)


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


class CourseItem(BaseModel):
    model_config = {"populate_by_name": True}

    course_id: int = Field(alias="courseId")
    course_name: str = Field(alias="courseName")
    description: str | None = None
    department: str | None = None
    language: str | None = None


class EmbedCoursesRequest(BaseModel):
    courses: list[CourseItem]
    mode: str = "UPSERT"  # UPSERT | FULL_REBUILD


@router.post("/embeddings/courses")
async def embeddings_courses(request: EmbedCoursesRequest):
    model = get_active_model()
    total = len(request.courses)
    logger.info("embed | model=%s mode=%s courses=%d", model, request.mode, total)
    start = time.perf_counter()

    embedded, failed = 0, 0
    errors = []

    try:
        embeddings = get_embeddings()

        # Build text to embed per course — combine all available text fields
        texts = []
        for c in request.courses:
            parts = [c.course_name]
            if c.description:
                parts.append(c.description)
            if c.department:
                parts.append(c.department)
            texts.append(" | ".join(parts))

        vectors = await embeddings.aembed_documents(texts)

        with get_connection() as conn:
            with conn.cursor() as cur:
                if request.mode == "FULL_REBUILD":
                    cur.execute("DELETE FROM course_embeddings")
                    logger.info("embed | full rebuild — deleted existing embeddings")

                for course, vector in zip(request.courses, vectors, strict=False):
                    try:
                        cur.execute(
                            """
                            INSERT INTO course_embeddings (course_id, embedding, updated_at)
                            VALUES (%s, %s, NOW())
                            ON CONFLICT (course_id) DO UPDATE
                                SET embedding = EXCLUDED.embedding,
                                    updated_at = NOW()
                            """,
                            (course.course_id, vector),
                        )
                        embedded += 1
                    except Exception as e:
                        failed += 1
                        errors.append(f"course_id={course.course_id}: {e}")
                        logger.warning("embed | failed course_id=%s: %s", course.course_id, e)

            conn.commit()

        elapsed_ms = round((time.perf_counter() - start) * 1000)
        logger.info(
            "embed | model=%s embedded=%d failed=%d duration_ms=%d",
            model,
            embedded,
            failed,
            elapsed_ms,
        )

        return JSONResponse(
            {
                "embedded": embedded,
                "skipped": 0,
                "failed": failed,
                "errors": errors,
            }
        )

    except Exception as e:
        logger.error("embed | model=%s unexpected error: %s", model, e)
        return JSONResponse({"error": "Embedding failed", "detail": str(e)}, status_code=502)


app.include_router(router)
