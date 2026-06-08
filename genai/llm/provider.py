import os
import urllib.request
import urllib.error
from functools import lru_cache

from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "cloud")

LOGOS_BASE_URL = os.getenv("LOGOS_BASE_URL", "https://logos.aet.cit.tum.de/v1")
LOGOS_API_KEY = os.getenv("LOGOS_API_KEY", "")
LOGOS_MODEL = os.getenv("LOGOS_MODEL", "openai/gpt-oss-120b")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


@lru_cache(maxsize=1)
def get_llm():
    """Factory — returns LangChain LLM client based on LLM_PROVIDER env var."""
    if LLM_PROVIDER == "local":
        return ChatOllama(base_url=OLLAMA_BASE_URL, model=OLLAMA_MODEL)
    return ChatOpenAI(
        base_url=LOGOS_BASE_URL,
        api_key=LOGOS_API_KEY,
        model=LOGOS_MODEL,
    )


def get_provider_info() -> dict:
    """Returns active provider name and model."""
    if LLM_PROVIDER == "local":
        return {"provider": "local", "model": OLLAMA_MODEL}
    return {"provider": "cloud", "model": LOGOS_MODEL}


def check_llm_health() -> str:
    """HTTP ping to LLM provider — no test prompt, just reachability check."""
    try:
        if LLM_PROVIDER == "local":
            url = f"{OLLAMA_BASE_URL}/api/tags"
        else:
            url = f"{LOGOS_BASE_URL}/models"

        req = urllib.request.Request(url)
        if LLM_PROVIDER == "cloud" and LOGOS_API_KEY:
            req.add_header("Authorization", f"Bearer {LOGOS_API_KEY}")

        urllib.request.urlopen(req, timeout=5)
        return "UP"
    except Exception:
        return "DOWN"
