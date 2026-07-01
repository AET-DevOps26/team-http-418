import logging
import os
from functools import lru_cache

import requests
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from requests import ConnectionError, HTTPError, Timeout

logger = logging.getLogger("genai")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "cloud")

LOGOS_BASE_URL = os.getenv("LOGOS_BASE_URL", "https://logos.aet.cit.tum.de")
LOGOS_API_VERSION = os.getenv("LOGOS_API_VERSION", "v1")
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
        openai_api_base=f"{LOGOS_BASE_URL}/{LOGOS_API_VERSION}",
        openai_api_key=LOGOS_API_KEY,
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
            response = requests.get(url, timeout=5)
        else:
            url = f"{LOGOS_BASE_URL}/{LOGOS_API_VERSION}/models"
            response = requests.get(url, headers={"Authorization": f"Bearer {LOGOS_API_KEY}"}, timeout=5)

        response.raise_for_status()
        return "UP"
    except ConnectionError as e:
        logger.warning("LLM health check failed — connection error: %s", e)
        return "DOWN"
    except Timeout as e:
        logger.warning("LLM health check failed — timeout: %s", e)
        return "DOWN"
    except HTTPError as e:
        logger.warning("LLM health check failed — HTTP %s: %s", e.response.status_code, e)
        return "DOWN"
    except Exception as e:
        logger.warning("LLM health check failed — unexpected error: %s", e)
        return "DOWN"
