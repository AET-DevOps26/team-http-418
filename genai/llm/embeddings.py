import logging
import os
from functools import lru_cache

from langchain_ollama import OllamaEmbeddings
from langchain_openai import OpenAIEmbeddings
from pydantic import SecretStr

logger = logging.getLogger("genai")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "cloud")

LOGOS_BASE_URL = os.getenv("LOGOS_BASE_URL", "https://logos.aet.cit.tum.de")
LOGOS_API_VERSION = os.getenv("LOGOS_API_VERSION", "v1")
LOGOS_API_KEY = os.getenv("LOGOS_API_KEY", "")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

EMBEDDING_MODEL_CLOUD = os.getenv("EMBEDDING_MODEL_CLOUD", "Qwen/Qwen3-Embedding-8B")
EMBEDDING_MODEL_LOCAL = os.getenv("EMBEDDING_MODEL_LOCAL", "nomic-embed-text")

# Dimensions per model — must match VECTOR(N) in course_embeddings table
# Switching providers requires FULL_REBUILD to re-embed all courses
EMBEDDING_DIMENSIONS: dict[str, int] = {
    "Qwen/Qwen3-Embedding-8B": 4096,
    "nomic-embed-text": 768,
}


@lru_cache(maxsize=1)
def get_embeddings():
    """Factory — returns LangChain embeddings client based on LLM_PROVIDER env var."""
    if LLM_PROVIDER == "local":
        model = EMBEDDING_MODEL_LOCAL
        logger.info("embeddings | provider=local model=%s", model)
        return OllamaEmbeddings(base_url=OLLAMA_BASE_URL, model=model)
    elif LLM_PROVIDER == "cloud":
        model = EMBEDDING_MODEL_CLOUD
        logger.info("embeddings | provider=cloud model=%s", model)
        return OpenAIEmbeddings(
            base_url=f"{LOGOS_BASE_URL}/{LOGOS_API_VERSION}",
            api_key=SecretStr(LOGOS_API_KEY),
            model=model,
        )
    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {LLM_PROVIDER!r}. Must be 'cloud' or 'local'.")


def get_active_model() -> str:
    if LLM_PROVIDER == "local":
        return EMBEDDING_MODEL_LOCAL
    elif LLM_PROVIDER == "cloud":
        return EMBEDDING_MODEL_CLOUD
    else:
        return "UNKNOWN"


def get_embedding_dimensions() -> int:
    return EMBEDDING_DIMENSIONS.get(get_active_model(), 4096)
