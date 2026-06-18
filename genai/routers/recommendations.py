import json
import logging
import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from psycopg2 import DatabaseError, OperationalError

from models.recommendations import RecommendationsRequest
from services.recommendations import generate_recommendations

logger = logging.getLogger("genai")

router = APIRouter()


@router.post("/me/recommendations")
async def recommendations(request: RecommendationsRequest):
    start = time.perf_counter()
    logger.info(
        "recommendations | program=%s semester=%d courses_available=%d",
        request.student.study_program,
        request.student.semester,
        len(request.available_courses),
    )

    try:
        result = await generate_recommendations(request)
        elapsed_ms = round((time.perf_counter() - start) * 1000)
        logger.info(
            "recommendations | returned=%d duration_ms=%d",
            len(result["recommendations"]),
            elapsed_ms,
        )
        return JSONResponse(result)

    except OperationalError as e:
        logger.error("recommendations | DB connection failed: %s", e)
        return JSONResponse({"error": "Database unavailable"}, status_code=503)
    except DatabaseError as e:
        logger.error("recommendations | DB query failed: %s", e)
        return JSONResponse({"error": "Database error"}, status_code=502)
    except (ValueError, json.JSONDecodeError) as e:
        logger.error("recommendations | LLM response invalid: %s", e)
        return JSONResponse({"error": "LLM returned unexpected response"}, status_code=502)
    except Exception as e:
        logger.error("recommendations | unexpected error: %s", e)
        return JSONResponse({"error": "Recommendations failed"}, status_code=502)
