import logging

from fastapi import HTTPException

from llm.provider import get_llm, get_provider_info

logger = logging.getLogger("genai")


async def chat(message: str) -> dict:
    provider_info = get_provider_info()
    # NOTE: remove message from logs before prod — will contain student data
    logger.info(
        "chat | model=%s provider=%s request_body=%r",
        provider_info["model"],
        provider_info["provider"],
        message,
    )
    try:
        llm = get_llm()
        result = await llm.ainvoke(message)
        token_usage = getattr(result, "response_metadata", {}).get("token_usage", {})
        logger.info(
            "chat | model=%s prompt_tokens=%s completion_tokens=%s total_tokens=%s",
            provider_info["model"],
            token_usage.get("prompt_tokens", "n/a"),
            token_usage.get("completion_tokens", "n/a"),
            token_usage.get("total_tokens", "n/a"),
        )
        return {"response": result.content}
    except TimeoutError as e:
        logger.error("chat | model=%s timeout: %s", provider_info["model"], e)
        raise HTTPException(
            status_code=504,
            detail="LLM request timed out — try again later",
        ) from e
    except Exception as e:
        logger.error("chat | model=%s unexpected error: %s", provider_info["model"], e)
        raise HTTPException(
            status_code=502,
            detail="LLM service unavailable — could not process chat message",
        ) from e
