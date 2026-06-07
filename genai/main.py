from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="AIDAN GenAI Service")


@app.get("/health")
async def health():
    return JSONResponse({"status": "UP"})


# ---------------------------------------------------------------------------
# Stub endpoints — returns 501 until implemented
# ---------------------------------------------------------------------------

@app.get("/courses")
async def courses_search():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@app.post("/me/recommendations")
async def recommendations():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@app.post("/me/roadmap/generate")
async def roadmap_generate():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@app.post("/me/advisor/conversations/{conversation_id}/messages")
async def advisor_chat(conversation_id: str):
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@app.post("/me/advisor/suggestions")
async def advisor_suggestions():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@app.post("/me/transcript/upload")
async def transcript_parse():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@app.post("/me/plan/validate")
async def plan_validate():
    return JSONResponse({"error": "Not implemented"}, status_code=501)


@app.post("/embeddings/courses")
async def embeddings_courses():
    return JSONResponse({"error": "Not implemented"}, status_code=501)
