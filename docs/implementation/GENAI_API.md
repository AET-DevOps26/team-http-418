# AIDAN — GenAI Internal API Specification

## Overview

This document defines the internal REST contract between **Spring Boot** (caller) and the **Python FastAPI GenAI service** (provider).

```
Client  →  Spring Boot (localhost:8080)  →  GenAI Service (genai:8000)
                                         ←  response / SSE stream
        ←  response (enriched by Spring Boot)
```

The React client **never** communicates with the GenAI service directly. Spring Boot assembles all required context from the database, calls the GenAI service, then enriches and returns the result to the client.

---

## Conventions

| Convention | Detail |
| :--- | :--- |
| **Base URL** | `http://genai:8000` — service name `genai`, port `8000` (FastAPI default). Must be added to `docker-compose.yml`. Configurable via `GENAI_BASE_URL` env var |
| **Endpoint paths** | GenAI endpoints mirror the Spring Boot paths they serve (e.g. Spring Boot `POST /me/roadmap/generate` calls GenAI `POST /me/roadmap/generate` at `genai:8000`) |
| **Auth** | No auth between services — GenAI is not exposed publicly. Network-level isolation only |
| **Errors** | `{ "error": "string", "detail": "string" }` with appropriate HTTP status |
| **Stateless** | GenAI holds no state. Spring Boot sends full context on every request |
| **Fallback** | If GenAI is unavailable, Spring Boot degrades gracefully (e.g. keyword search instead of semantic search) |
| **Streaming** | Chat endpoint streams via SSE. All other endpoints return synchronous JSON |
| **Dates** | ISO-8601 UTC strings everywhere (`2025-05-13T10:00:00Z`) |
| **Semester keys** | `WS2024` / `SS2025` — two-letter prefix + 4-digit year |

---

## Endpoints

---

### Health

| Impl | Method | Endpoint | Description | Called by |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | `GET` | `/health` | Liveness check — confirms GenAI service is up and ready | All Spring Boot services |

<details>
<summary>Response schema</summary>

```json
{ "status": "UP" }
```

Possible values: `UP` (service running and ready) / `DOWN` (service unavailable).
</details>

---

### Semantic Course Search

> Spring Boot endpoint: `GET /courses?ai=true` (Browsing Service) → calls this GenAI endpoint:

| Impl | Method | Endpoint | Body | Status | Description | Called by |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/courses` | `{ query, limit, filters }` | 200 | Embed query string, run vector similarity search, return ranked course IDs + scores | Browsing Service |

Spring Boot falls back to SQL `ILIKE` keyword search if this call fails.

<details>
<summary>Request / response schemas</summary>

**Request** *(Spring Boot sends)*
```json
{
  "query": "machine learning for robotics",
  "limit": 20,
  "filters": {
    "department": "Informatics",
    "language": "EN",
    "level": "MASTER"
  }
}
```

**Response**
```json
{
  "results": [
    { "courseId": "uuid", "score": 0.94 },
    { "courseId": "uuid", "score": 0.87 }
  ]
}
```

> Spring Boot uses returned `courseId` list to fetch full `CourseSummary[]` from PostgreSQL and return to client.
</details>

---

### Course Recommendations

> Spring Boot endpoint: `GET /me/recommendations` (Planning Service) → calls this GenAI endpoint:

| Impl | Method | Endpoint | Body | Status | Description | Called by |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/recommendations` | `{ student, completedCourses, enrolledCourses, availableCourses, limit, ... }` | 200 | Generate personalized course recommendations from student context | Planning Service |

> **Note**: `POST /me/recommendations` (client-facing) is handled entirely by Spring Boot — it does **not** delegate to GenAI.

<details>
<summary>Request / response schemas</summary>

**Request** *(Spring Boot assembles from DB)*
```json
{
  "student": {
    "studyProgram": "Informatics M.Sc.",
    "semester": 5,
    "careerGoals": ["AI researcher", "ML engineer"],
    "interests": ["computer vision", "NLP"],
    "preferredWorkload": 30
  },
  "completedCourses": [
    { "courseId": "uuid", "courseCode": "IN2346", "courseName": "Introduction to Deep Learning", "credits": 6 }
  ],
  "enrolledCourses": [
    { "courseId": "uuid", "courseCode": "IN2349", "courseName": "Advanced Deep Learning", "credits": 6 }
  ],
  "availableCourses": [
    { "courseId": "uuid", "courseCode": "IN2390", "courseName": "Robot Learning", "credits": 6, "description": "..." }
  ],
  "limit": 10,
  "category": "Elective",
  "semester": "SS2025"
}
```

**Response**
```json
{
  "recommendations": [
    {
      "courseId": "uuid",
      "relevanceScore": 0.92,
      "reason": "Aligns with your robotics goal and builds on your completed ML courses",
      "tags": ["robotics", "machine-learning"]
    }
  ],
  "generatedAt": "2025-05-13T10:00:00Z"
}
```

> Spring Boot enriches: checks `prerequisitesMet` (relational query), filters already-completed courses, returns final `RecommendationList` to client.
</details>

---

### Roadmap Generation

> Spring Boot endpoint: `POST /me/roadmap/generate` (Planning Service) → calls this GenAI endpoint:

| Impl | Method | Endpoint | Body | Status | Description | Called by |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `POST` | `/me/roadmap/generate` | `{ student, completedCourses, enrolledCourses, degreeRequirements, availableCourses }` | 200 | Generate semester-by-semester academic roadmap from student context | Planning Service |

**Async**: Spring Boot returns `202 Accepted` to client immediately, calls this endpoint in background. Client polls a status URL to retrieve the result when ready.

<details>
<summary>Request / response schemas</summary>

**Request** *(Spring Boot assembles from DB)*
```json
{
  "student": {
    "studyProgram": "Informatics M.Sc.",
    "semester": 5,
    "careerGoals": ["graduate by SS2026", "specialize in AI"],
    "interests": ["machine learning", "computer vision"],
    "preferences": {
      "maxCreditsPerSemester": 30,
      "preferredLanguage": "EN"
    }
  },
  "completedCourses": [
    { "courseId": "uuid", "courseCode": "IN2346", "credits": 6, "category": "Elective" }
  ],
  "enrolledCourses": [
    { "courseId": "uuid", "courseCode": "IN2349", "credits": 6, "semester": "SS2025" }
  ],
  "degreeRequirements": {
    "totalCreditsRequired": 120,
    "totalCreditsEarned": 90,
    "remainingSemesters": 2,
    "categories": [
      { "name": "Core Modules", "creditsRequired": 50, "creditsEarned": 40 },
      { "name": "Electives", "creditsRequired": 30, "creditsEarned": 30 }
    ]
  },
  "availableCourses": [
    { "courseId": "uuid", "courseCode": "IN2390", "courseName": "Robot Learning", "credits": 6, "preferredSemester": "WS", "hasPrerequisites": true }
  ]
}
```

**Response**
```json
{
  "semesters": [
    {
      "semesterKey": "WS2025",
      "totalCredits": 28,
      "courses": [
        { "courseId": "uuid", "courseCode": "IN2390", "reason": "Core AI elective aligned with robotics goal" }
      ]
    }
  ],
  "summary": "2-semester plan to graduate by SS2026 with AI specialization",
  "generatedAt": "2025-05-13T10:00:00Z"
}
```

> Spring Boot saves roadmap to DB and returns full `Roadmap` object to client.
</details>

---

### Advisor Chat Completion

> Spring Boot endpoint: `POST /me/advisor/conversations/{id}/messages` (Planning Service) → calls this GenAI endpoint:

| Impl | Method | Endpoint | Body | Status | Description | Called by |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `POST` | `/me/advisor/conversations/{conversationId}/messages` | `{ student, completedCourses, conversationHistory, newMessage }` | 200 / SSE | Generate streaming chat response from conversation history + student context | Planning Service |

**Streaming**: GenAI streams SSE tokens back to Spring Boot, which forwards the stream to the client. After stream ends, Spring Boot saves the completed assistant message to DB.

<details>
<summary>Request / response schemas</summary>

**Request**
```json
{
  "student": {
    "studyProgram": "Informatics M.Sc.",
    "semester": 5,
    "careerGoals": ["AI researcher"],
    "interests": ["computer vision"],
    "totalCreditsEarned": 90,
    "totalCreditsRequired": 120
  },
  "completedCourses": [
    { "courseCode": "IN2346", "courseName": "Introduction to Deep Learning", "credits": 6 }
  ],
  "conversationHistory": [
    { "role": "USER", "content": "What electives should I take next semester?" },
    { "role": "ASSISTANT", "content": "Based on your interest in computer vision..." }
  ],
  "newMessage": "What about robotics courses?"
}
```

> `conversationHistory` contains last N messages. Exact N — TBD (open question).

**Response** *(SSE stream — `Accept: text/event-stream`)*
```
data: {"token": "Based"}
data: {"token": " on"}
data: {"token": " your"}
...
data: {"done": true, "fullContent": "Based on your completed ML courses..."}
```

**Response** *(fallback JSON — `Accept: application/json`)*
```json
{
  "content": "Based on your completed ML courses, I recommend Robot Learning (IN2390)...",
  "referencedCourses": [
    { "courseId": "uuid", "courseCode": "IN2390" }
  ]
}
```
</details>

---

### Advisor Prompt Suggestions

> Spring Boot endpoint: `GET /me/advisor/suggestions` (Planning Service) → calls this GenAI endpoint:

| Impl | Method | Endpoint | Body | Status | Description | Called by |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/advisor/suggestions` | `{ student, completedCourses }` | 200 | Generate personalized prompt chip suggestions based on student context | Planning Service |

Sync JSON — no streaming. Shown on advisor page before student types anything.

<details>
<summary>Request / response schemas</summary>

**Request**
```json
{
  "student": {
    "studyProgram": "Informatics M.Sc.",
    "semester": 5,
    "careerGoals": ["AI researcher"],
    "totalCreditsEarned": 90,
    "totalCreditsRequired": 120,
    "currentSemester": "SS2025"
  },
  "completedCourses": [
    { "courseCode": "IN2346", "courseName": "Introduction to Deep Learning" }
  ]
}
```

**Response**
```json
[
  { "text": "What electives should I take next semester?", "category": "RECOMMENDATIONS" },
  { "text": "Am I on track to graduate by SS2026?", "category": "SCHEDULE" },
  { "text": "What prerequisites am I still missing for my goals?", "category": "PREREQUISITES" },
  { "text": "Show me courses related to computer vision I haven't taken yet.", "category": "RECOMMENDATIONS" }
]
```
</details>

---

### Transcript Fuzzy Matching

> Spring Boot endpoint: `POST /me/transcript/upload` (Student Service) → calls this GenAI endpoint:

| Impl | Method | Endpoint | Body | Status | Description | Called by |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `POST` | `/me/transcript/upload` | `{ unmatchedCourses, availableCourses }` | 200 | Fuzzy-match unrecognized transcript course names to catalog entries | Student Service |

**Status: open / TBD** — requires real catalog data from scraper. Spring Boot first attempts exact + normalized matching. Only unmatched courses are sent here.

<details>
<summary>Request / response schemas</summary>

**Request**
```json
{
  "unmatchedCourses": [
    { "rawName": "Intro to Deep Learning", "rawCredits": 6 },
    { "rawName": "Algorithmen und Datenstrukturen", "rawCredits": 8 }
  ],
  "availableCourses": [
    { "courseId": "uuid", "courseCode": "IN2346", "courseName": "Introduction to Deep Learning", "credits": 6 },
    { "courseId": "uuid", "courseCode": "IN2001", "courseName": "Algorithms and Data Structures", "credits": 8 }
  ]
}
```

**Response**
```json
{
  "matches": [
    { "rawName": "Intro to Deep Learning", "courseId": "uuid", "courseCode": "IN2346", "confidence": 0.96 },
    { "rawName": "Algorithmen und Datenstrukturen", "courseId": "uuid", "courseCode": "IN2001", "confidence": 0.91 }
  ],
  "unresolved": []
}
```

> Spring Boot auto-imports matches above confidence threshold (TBD, e.g. 0.85). Below threshold — flagged for manual review.
</details>

---

### Plan Validation

> Spring Boot endpoint: `GET /me/schedule/conflicts` (Planning Service) → calls this GenAI endpoint:

| Impl | Method | Endpoint | Body | Status | Description | Called by |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `POST` | `/me/plan/validate` | `{ student, semesterPlan, completedCourses }` | 200 | Holistic workload + conflict analysis beyond rule-based time overlap | Planning Service |

Spring Boot runs rule-based time overlap checks independently. This endpoint adds AI-powered soft warnings (unrealistic workload, risky course combinations, scheduling preference violations). Spring Boot merges both result sets before returning `ConflictList` to client.

<details>
<summary>Request / response schemas</summary>

**Request**
```json
{
  "student": {
    "semester": 5,
    "careerGoals": ["AI researcher"],
    "preferences": {
      "maxCreditsPerSemester": 30,
      "blockedTimeSlots": [
        { "day": "MONDAY", "startTime": "08:00", "endTime": "10:00" }
      ],
      "preferNoBackToBack": true
    }
  },
  "semesterPlan": {
    "semesterKey": "SS2025",
    "totalCredits": 42,
    "courses": [
      {
        "courseId": "uuid",
        "courseCode": "IN2349",
        "courseName": "Advanced Deep Learning",
        "credits": 6,
        "schedule": [
          { "day": "MONDAY", "startTime": "10:00", "endTime": "12:00", "type": "LECTURE" }
        ]
      }
    ]
  },
  "completedCourses": [
    { "courseCode": "IN2346", "courseName": "Introduction to Deep Learning" }
  ]
}
```

**Response**
```json
{
  "warnings": [
    {
      "type": "WORKLOAD_EXCEEDED",
      "severity": "WARNING",
      "message": "42 ECTS in one semester is above your stated maximum of 30"
    },
    {
      "type": "SCHEDULING_PREFERENCE",
      "severity": "INFO",
      "message": "IN2349 lecture on Monday 10:00 is close to your blocked morning slot"
    }
  ]
}
```
</details>

---

### Batch Course Embedding

> **Internal pipeline only** — not triggered by client. Called by Scraper after ingestion or by Catalog Service on demand. Client has no knowledge of this endpoint.

| Impl | Method | Endpoint | Body | Status | Description | Called by |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `POST` | `/embeddings/courses` | `{ courses, mode }` | 200 | Embed course descriptions and store vectors in Vector DB | Catalog Service / Scraper trigger |

Triggered after scraper ingestion adds or updates courses. Also run on first setup (bulk embed all courses). Required for semantic search and recommendations to work.

<details>
<summary>Request / response schemas</summary>

**Request**
```json
{
  "courses": [
    {
      "courseId": "uuid",
      "courseCode": "IN2346",
      "courseName": "Introduction to Deep Learning",
      "description": "Full course description text...",
      "department": "Informatics",
      "credits": 6,
      "language": "EN"
    }
  ],
  "mode": "UPSERT"
}
```

> `mode`: `UPSERT` (add or update), `FULL_REBUILD` (re-embed everything, used on schema changes)

**Response**
```json
{
  "embedded": 42,
  "skipped": 0,
  "failed": 0,
  "errors": []
}
```
</details>

---

## Open Questions

| # | Question | Impact |
| :--- | :--- | :--- |
| 1 | Vector DB: **pgvector** (simpler, one DB) vs **Weaviate** (dedicated, bonus points per course spec) | Affects `/embeddings/courses` and `/courses` search implementation |
| 2 | Chat **context window size** — last N messages sent in conversation history | Affects cost and coherence of advisor responses |
| 3 | Transcript fuzzy matching confidence **threshold** for auto-import vs manual review | Affects `/me/transcript/upload` usage |
| 4 | **Embedding model** — OpenAI `text-embedding-3-small` (cloud) vs local alternative | Affects all vector search quality |

---

## References

- `docs/implementation/ENDPOINTS.md` — frontend ↔ Spring Boot contract (source of truth for client-facing shapes)
