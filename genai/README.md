# AIDAN — GenAI Microservice

Python FastAPI service. Handles all AI features for AIDAN.
Spring Boot calls this service internally — client never talks to it directly.

Internal API contract: `docs/implementation/GENAI_API.md`
Base URL (internal Docker network): `http://genai:8000/v1`

---

## LLM Providers

Two providers supported. Switch via `LLM_PROVIDER` in `.env` — no code changes needed.

### Cloud — Logos (default)

TUM-provided OpenAI-compatible API.

```
LLM_PROVIDER=cloud
LOGOS_BASE_URL=https://logos.aet.cit.tum.de
LOGOS_API_VERSION=v1
LOGOS_API_KEY=lg-...        # get from your tutor
LOGOS_MODEL=openai/gpt-oss-120b
```

> **Network requirement**: Logos is only reachable from TUM network or via [eduVPN](https://www.it.tum.de/it/vpn/).

Test connection manually (replace $LOGOS_API_KEY with your key):
```bash
curl -X POST https://logos.aet.cit.tum.de/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGOS_API_KEY" \
  -d '{"model": "openai/gpt-oss-120b", "messages": [{"role": "user", "content": "Say hi in 3 words."}]}'
```

List available models for your key:
```bash
curl https://logos.aet.cit.tum.de/v1/models \
  -H "Authorization: Bearer $LOGOS_API_KEY"
```

---

### Local — Ollama

Runs locally via Docker. No internet required. Slower than cloud on CPU.

```
LLM_PROVIDER=local
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2
```

Start Ollama alongside other services:
```bash
docker compose --profile local up
```

Pull model into Ollama (first run only):
```bash
docker compose exec ollama ollama pull llama3.2
```

---

## Embedding Models

Used for semantic search and recommendation vector pipeline. Separate from LLM provider.
Switch via `EMBEDDING_MODEL_CLOUD` / `EMBEDDING_MODEL_LOCAL` in `.env`.

| Mode | Model | Dimensions | Provider |
|---|---|---|---|
| `cloud` | `Qwen/Qwen3-Embedding-8B` | 4096 | Logos (same API key) |
| `local` | `nomic-embed-text` | 768 | Ollama |

> **Note**: Cloud embedding model (`Qwen/Qwen3-Embedding-8B`) requires TUM network / eduVPN same as LLM.

Pull local embedding model into Ollama (first run only):
```bash
docker compose exec ollama ollama pull nomic-embed-text
```

Test cloud embedding model manually:
```bash
curl -X POST https://logos.aet.cit.tum.de/v1/embeddings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGOS_API_KEY" \
  -d '{"model": "Qwen/Qwen3-Embedding-8B", "input": "Introduction to Deep Learning"}'
```

---

## Running GenAI service only

No need to start all services for development.

**1. Copy env file and set your provider:**
```bash
cp ../.env.example ../.env
# edit .env — set LLM_PROVIDER and relevant API key or Ollama settings
```

**2. Start only genai (cloud mode):**
```bash
docker compose up genai --build
```

**3. Start genai + Ollama (local mode):**
```bash
docker compose --profile local up genai ollama --build
```

---

## Testing

**Health check — verify service is up and LLM is reachable:**
```bash
docker compose exec genai python -c \
  "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/v1/health').read())"
```

Expected response (cloud, reachable):
```json
{
  "status": "UP",
  "llm": {
    "status": "UP",
    "provider": "cloud",
    "model": "openai/gpt-oss-120b"
  }
}
```

Expected response (LLM unreachable — e.g. no eduVPN):
```json
{
  "status": "UP",
  "llm": {
    "status": "DOWN",
    "provider": "cloud",
    "model": "openai/gpt-oss-120b"
  }
}
```

**Verify not reachable from host (security check):**
```bash
curl http://localhost:8000/v1/health
# expected: connection refused
```

**Stub endpoints — all return 501 until implemented:**
```bash
docker compose exec genai python -c \
  "import urllib.request; urllib.request.urlopen(urllib.request.Request('http://localhost:8000/v1/me/recommendations', method='POST'))"
# expected: HTTPError 501
```

---

## Project Structure

```
genai/
├── main.py              # FastAPI app, route registration
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container definition
├── README.md            # This file
└── llm/
    ├── __init__.py
    ├── provider.py      # LLM factory — returns ChatOpenAI or ChatOllama
    └── embeddings.py    # Embedding factory — returns cloud or local embedding model (TODO)
```
