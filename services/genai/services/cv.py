import io
import json
import logging
from pathlib import Path

from fastapi import HTTPException

from llm.provider import get_llm

_CV_PARSE_PROMPT = (Path(__file__).parent.parent / "prompts" / "cv_parse.txt").read_text()

logger = logging.getLogger("genai")


async def parse_cv(pdf_bytes: bytes) -> dict:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except ImportError:
        raise HTTPException(status_code=500, detail="pypdf not installed — cannot extract PDF text")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {e}")

    if not text.strip():
        raise HTTPException(status_code=422, detail="PDF contains no extractable text")

    prompt = _CV_PARSE_PROMPT.format(cv_text=text[:8000])
    try:
        llm = get_llm()
        result = await llm.ainvoke(prompt)
        parsed = json.loads(result.content)
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("cv_parse | LLM response invalid: %s", e)
        raise HTTPException(status_code=502, detail="LLM returned malformed CV parse response")
    except Exception as e:
        logger.error("cv_parse | LLM call failed: %s", e)
        raise HTTPException(status_code=502, detail=f"LLM service unavailable: {e}")

    return parsed
