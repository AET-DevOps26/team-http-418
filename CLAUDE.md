# AIDAN - AI-powered Academic Advisor

## Architecture

```
Client (React/Vite :3000)
  → Server (Spring Boot :8080)
      → GenAI (FastAPI/uvicorn :8000) → LOGOS API (TUM cloud LLM)
      → User-Profile-Service (Spring Boot :8060)
      → PDF-Parser (Spring Boot :8070)
  → PostgreSQL (:5432)
      databases: courses-data, security, profiles
```

## Dev Startup

```bash
./scripts/dev-start.sh --all    # start everything
./scripts/dev-reset.sh          # wipe DB volumes (destructive)
```

After changing Java source, if `bootRun` shows `compileJava UP-TO-DATE` and changes aren't taking effect, run `./gradlew clean` in the affected service directory. Gradle daemon caching can serve stale class files, especially across workspace symlinks.

## Service Communication Pitfalls

### Server → GenAI (Spring Boot → FastAPI/uvicorn)

The static `RestClient.create()` in `Http418Application` has **no Jackson message converters**. Sending `.body(javaObject)` with `contentType(APPLICATION_JSON)` produces an empty HTTP body — Spring silently drops it because no converter matches `Object + application/json`.

**Current workaround** (`ExternalServices.java`): `callTranscriptMatch` uses `java.net.http.HttpClient` with explicit ObjectMapper serialization. Other methods that send JSON bodies via the static `restClient` (e.g. recommendations, profile upsert, roadmap) still have this bug.

**HTTP/2 breaks uvicorn body parsing.** Java's `HttpClient` defaults to HTTP/2 and sends `Upgrade: h2c` headers. Uvicorn logs `WARNING: Unsupported upgrade request` and drops the request body. Force `HttpClient.Version.HTTP_1_1`.

### GenAI → LOGOS API

Requires **TUM network or eduVPN**. Set `LOGOS_API_KEY=lg-...` in `.env`. The genai service uses the OpenAI-compatible API at `https://logos.aet.cit.tum.de`.

GenAI's error handler (`main.py`) logs `Payload received: Empty Body` in the 422 handler, but this is **misleading** — FastAPI already consumed the body stream before the handler runs. The actual issue is always upstream (body not sent by caller), not in FastAPI's body reading.

### Client → Server

Client dev server runs on `:3000` (or next available port like `:3001`). Vite proxies `/api` requests to the Spring Boot server on `:8080`.

## Database

Three PostgreSQL databases in one container:
- **courses-data** — course catalog (read-only from server, populated by scraper)
- **security** — credentials, completed/enrolled courses, conversations, roadmaps
- **profiles** — user profile cache (managed by user-profile-service)

`student_completed_courses` has a `status` column: `confirmed | pending | unmatched | skipped`. Dashboard/progress queries filter `WHERE status = 'confirmed'`. Import flow uses pending/unmatched states.

## Key directories

```
services/
  server/          Spring Boot main API (:8080)
  client/          React + Vite frontend
  genai/           FastAPI Python service (LLM, embeddings, transcript matching)
  user-profile-service/  Spring Boot profile service (:8060)
  pdf-parser/      Spring Boot PDF parsing (:8070)
  scraper/         One-shot course catalog scraper
infra/
  db/              PostgreSQL Dockerfile + seed data
scripts/
  dev-start.sh     Dev orchestrator
  dev-reset.sh     Wipe containers + volumes
```

## Testing

```bash
cd services/server && ./gradlew test          # Java tests (H2 in-memory DB)
cd services/client && pnpm tsc --noEmit       # TypeScript typecheck
```

Pre-existing type errors in `advisor.ts` and `CoursePill.tsx` — not from this branch.
