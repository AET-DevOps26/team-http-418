# AIDAN — API Endpoint Specification

## Conventions

| Convention | Detail                                                                                                                                                                                                                      |
| :--- |:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Base path** | Spring Boot exposes all endpoints at `/api/{version}/*` on `localhost:8080`.                                                                                                                                                |
| **Authentication** | JWT Bearer token in the `Authorization: Bearer <token>` header. Identity is extracted from the token — no user ID in the path.                                                                                              |
| **Pagination** | List endpoints accept `?page=0&size=20&sort=field,asc`. Response is a `Page<T>`: `{ "content": [...], "totalElements": N, "totalPages": N, "number": 0, "size": 20 }`                                                       |
| **Errors** | RFC 7807 `ProblemDetail`: `{ "type": "uri", "title": "string", "status": 400, "detail": "string", "instance": "/path" }`                                                                                                    |
| **Dates** | ISO-8601 UTC strings everywhere (`2025-05-13T10:00:00Z`)                                                                                                                                                                    |
| **Semester keys** | `WS2024` / `SS2025` — two-letter prefix + 4-digit year                                                                                                                                                                      |
| **Streaming** | The advisor chat endpoint supports SSE via `Accept: text/event-stream` for incremental token delivery (typing indicator). Falls back to synchronous JSON with `Accept: application/json`.                                   |

---

## Must Have

> Covers: **Auth**, **AIDAN 1** (Academic Tracking), **AIDAN 2** (Centralized Search), **Health**

---

### Health

| Impl | Method | Endpoint | Description | Service |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | `GET` | `/health` | Full health check with component statuses | System |
| [ ] | `GET` | `/health/ready` | Readiness probe (k8s / Docker) | System |
| [ ] | `GET` | `/health/live` | Liveness probe | System |

<details>
<summary>Response schemas</summary>

**`GET /health`**
```json
{
  "status": "UP",
  "components": {
    "db": "UP",
    "genai": "UP"
  }
}
```

**`GET /health/ready` / `GET /health/live`**
```json
{ "status": "UP" }
```
</details>

---

### Authentication

| Impl  | Method | Endpoint | Params / Body | Status | Description | Service |
|:-----:| :---: | :--- | :--- | :---: | :--- | :--- |
| [ x ] | `POST` | `/auth/register` | Body: `{ tumId, password }` | 200 / 409 | Register a new user | Student Service |
| [ x ] | `POST` | `/auth/login` | Body: `{ tumId, password }` | 200 / 401 | Exchange TUM credentials for JWT access + refresh tokens | Student Service |
| [ x ] | `POST` | `/auth/refresh` | Body: `{ refreshToken }` | 200 / 401 | Rotate tokens using a valid refresh token | Student Service |
| [ x ] | `POST` | `/auth/logout` | Header: `Authorization` | 204 | Invalidate the current session | Student Service |

<details>
<summary>Request / response schemas</summary>

**`POST /auth/login` and `POST /auth/register` — request**
```json
{
  "tumId": "ga12abc",
  "password": "string"
}
```

**`POST /auth/login` and `POST /auth/register` — response**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```

**`POST /auth/refresh` — request**
```json
{ "refreshToken": "eyJ..." }
```

**`POST /auth/refresh` — response** *(same shape as login)*
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 3600
}
```
</details>

> **Note**: TUM SSO / Shibboleth via OAuth2 is the likely long-term integration point. Initial implementation uses local JWT issuance.

---

### Academic Tracking (AIDAN 1)

| Impl  | Method | Endpoint | Params / Body | Status | Description | Service |
|:-----:| :---: | :--- | :--- | :---: | :--- | :--- |
|  [ ]  | `GET` | `/me/progress` | — | 200 | Academic KPIs: credits earned, GPA, progress %, alerts | Student Service |
|  [ ]  | `POST` | `/me/transcript/upload` | Multipart: `file` (PDF/CSV) | 200 / 422 | Parse and import transcript into completed courses | Student Service |
to update fields do a full profile update using POST /me

<details>
<summary>Response schemas</summary>

**`GET /me/progress` — `AcademicProgress`**
```json
{
  "totalCreditsEarned": 90,
  "totalCreditsRequired": 120,
  "gpa": 1.85,
  "completedCourseCount": 18,
  "enrolledCourseCount": 4,
  "currentSemester": "SS2025",
  "progressPercentage": 75.0,
  "creditsByCategory": [
    { "category": "Core Modules", "earned": 40, "required": 50 },
    { "category": "Electives",    "earned": 30, "required": 30 },
    { "category": "Thesis",       "earned": 0,  "required": 30 },
    { "category": "Practical",    "earned": 20, "required": 10 }
  ]
}
```

**`GET /me/courses/completed` — `CompletedCourse`** *(single item in paginated list)*
```json
{
  "courseId": "uuid",
  "courseCode": "IN2346",
  "courseName": "Introduction to Deep Learning",
  "credits": 6,
  "grade": 1.7,
  "semester": "WS2024",
  "category": "Elective"
}
```

**`GET /me/courses/enrolled` — `EnrolledCourse`** *(single item in paginated list)*
```json
{
  "courseId": "uuid",
  "courseCode": "IN2349",
  "courseName": "Advanced Deep Learning",
  "credits": 6,
  "semester": "SS2025",
  "schedule": [
    { "day": "MONDAY", "startTime": "10:00", "endTime": "12:00", "room": "MW 0001", "type": "LECTURE" }
  ]
}
```

**`GET /me/requirements` — `DegreeRequirements`**
```json
{
  "studyProgram": { "id": "uuid", "name": "Informatics M.Sc." },
  "totalCreditsRequired": 120,
  "totalCreditsEarned": 90,
  "categories": [
    {
      "name": "Core Modules",
      "creditsRequired": 50,
      "creditsEarned": 40,
      "fulfilled": false,
      "courses": [
        {
          "courseId": "uuid",
          "courseCode": "IN2001",
          "courseName": "Algorithms",
          "credits": 8,
          "status": "COMPLETED | ENROLLED | MISSING",
          "isRequired": true
        }
      ]
    }
  ],
  "alerts": [
    { "type": "WARNING", "message": "Missing prerequisite IN2001 for IN2349" }
  ]
}
```

**`POST /me/transcript/upload` — `TranscriptImportResult`**
```json
{
  "importedCount": 15,
  "skippedCount": 2,
  "errors": ["Could not match course 'XYZ123' to catalog"],
  "importedCourses": [
    { "courseCode": "IN2346", "courseName": "Introduction to Deep Learning", "credits": 6 }
  ]
}
```
</details>

---

### Course Catalog & Search (AIDAN 2)

| Impl  | Method | Endpoint | Params / Body | Status | Description | Service |
|:-----:| :---: | :--- | :--- | :---: | :--- | :--- |
| [ x ] | `GET` | `/courses` | Query: `page, size, sort, search, department, semester, credits_min, credits_max, language, level, studyProgramId, ai` | 200 | Paginated, filtered course listing; when `ai=true`, the `search` param is interpreted as a semantic query against the Vector DB instead of a keyword filter | Browsing Service + AI Service |
| [ x ] | `GET` | `/courses/{courseId}` | — | 200 / 404 | Full course details | Browsing Service |
|  [ ]  | `GET` | `/departments` | — | 200 | All TUM departments | Catalog Service |
|  [ ]  | `GET` | `/study-programs` | — | 200 | Study programs | Catalog Service |
| [ - ] | `GET` | `/study-programs/{programId}` | — | 200 / 404 | Study program detail with credit breakdown | Catalog Service |
| [ - ] | `GET` | `/study-programs/{programId}/courses` | Query: `page, size, category, semester` | 200 | Courses offered within a study program | Catalog Service |

<details>
<summary>Response schemas</summary>

**`GET /courses` — `CourseSummary`** *(used in paginated list and search results)*
```json
{
  "id": "uuid",
  "courseCode": "IN2346",
  "name": "Introduction to Deep Learning",
  "department": "Informatics",
  "credits": 6,
  "language": "EN",
  "level": "MASTER",
  "preferredSemester": "WS",
  "hasPrerequisites": true,
  "instructors": ["Prof. Niessner"]
}
```

**`GET /courses/{courseId}` — `CourseDetail`**
```json
{
  "id": "uuid",
  "courseCode": "IN2346",
  "name": "Introduction to Deep Learning",
  "description": "Full course description (Markdown or plain text)",
  "department": "Informatics",
  "credits": 6,
  "language": "EN",
  "level": "MASTER",
  "preferredSemester": "WS",
  "generalRequirements": "Solid linear algebra and Python skills",
  "instructors": [
    { "name": "Prof. Niessner", "email": "niessner@tum.de" }
  ],
  "schedule": [
    { "day": "TUESDAY",  "startTime": "14:00", "endTime": "16:00", "room": "MW 2001", "type": "LECTURE" },
    { "day": "THURSDAY", "startTime": "14:00", "endTime": "16:00", "room": "MW 2001", "type": "TUTORIAL" }
  ],
  "prerequisites": [
    { "courseId": "uuid", "courseCode": "IN2345", "name": "Machine Learning", "type": "REQUIRED" }
  ],
  "studyPrograms": [
    { "id": "uuid", "name": "Informatics M.Sc.", "category": "Elective" }
  ],
  "sourceUrl": "https://campus.tum.de/...",
  "lastUpdated": "2025-05-13T10:00:00Z"
}
```

**`GET /study-programs/{programId}` — `StudyProgramDetail`**
```json
{
  "id": "uuid",
  "name": "Informatics M.Sc.",
  "department": "Informatics",
  "description": "...",
  "totalCreditsRequired": 120,
  "categories": [
    { "name": "Core Modules", "creditsRequired": 50, "courseCount": 12 },
    { "name": "Electives",    "creditsRequired": 30, "courseCount": 85 }
  ]
}
```
</details>

---

## Should Have

> Covers: **AIDAN 3** (Profile), **AIDAN 4** (Recommendations), **AIDAN 5** (Pathway Visualization), **AIDAN 6** (Prerequisite Mapping), **Dashboard**, **AI Advisor**, **Schedule View**

---

### Student Profile (AIDAN 3)

| Impl | Method | Endpoint | Params / Body | Status | Description                                  | Service |
| :---: |:------:| :--- | :--- | :---: |:---------------------------------------------| :--- |
| [ ] | `GET`  | `/me` | — | 200 | Get the authenticated student's full profile | Student Service |
| [ ] | `POST` | `/me` | Body: `StudentProfile` | 200 | replace the current with the given profile   | Student Service |

<details>
<summary>Request / response schemas</summary>

**`GET /me` — `StudentProfile`**
```json
{
  "id": "uuid",
  "tumId": "ga12abc",
  "semester": 5,
  "studyPrograms": [
    { "id": "uuid", "name": "Informatics M.Sc.", "department": "Informatics" }
  ],
  "totalCredits": 90,
  "preferredWorkload": 30,
  "careerGoals": ["AI researcher", "ML engineer"],
  "interests": ["computer vision", "NLP"],
}
```

**`StudentProfileUpdate`** *(request body for PUT / PATCH)*
```json
{
  "tumId": "ga12abc",
  "semester": 6,
  "studyPrograms": [
    { "id": "uuid", "name": "Informatics M.Sc.", "department": "Informatics" }
  ],
  "totalCredits": 90,
  "preferredWorkload": 30,
  "careerGoals": ["AI researcher", "ML engineer"],
  "interests": ["computer vision", "NLP"],
}
```
</details>

---

### AI Recommendations (AIDAN 4)

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/recommendations` | Query: `limit, category, semester` | 200 | Personalized course recommendations based on profile + history | Planning Service + AI Service |
| [ ] | `POST` | `/me/recommendations` | Body: `{ goals, interests, excludeCourseIds }` | 200 | On-demand recommendation with explicit context override | Planning Service + AI Service |

<details>
<summary>Request / response schemas</summary>

**`POST /me/recommendations` — request**
```json
{
  "goals": ["specialize in robotics"],
  "interests": ["motion planning", "computer vision"],
  "excludeCourseIds": ["uuid-already-seen"]
}
```

**`RecommendationList`** *(response for both GET and POST)*
```json
{
  "recommendations": [
    {
      "courseId": "uuid",
      "courseCode": "IN2390",
      "courseName": "Robot Learning",
      "credits": 6,
      "relevanceScore": 0.92,
      "reason": "Aligns with your interest in robotics and builds on your completed ML courses",
      "tags": ["robotics", "machine-learning"],
      "prerequisitesMet": true
    }
  ],
  "generatedAt": "2025-05-13T10:00:00Z"
}
```
</details>

---

### Roadmap & Semester Plans (AIDAN 5)

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/roadmap` | — | 200 / 404 | Retrieve current roadmap with all semester plans | Planning Service |
| [ ] | `POST` | `/me/roadmap/generate` | Body: `RoadmapGenerateRequest` | 200 / 202 | AI-generate (or regenerate) the full roadmap | Planning Service + AI Service |
| [ ] | `PUT` | `/me/roadmap` | Body: `RoadmapUpdate` | 200 | Update roadmap aims / preferences / interests | Planning Service |
| [ ] | `GET` | `/me/roadmap/semesters` | — | 200 | All semester plans in the roadmap | Planning Service |
| [ ] | `GET` | `/me/roadmap/semesters/{semesterKey}` | — | 200 / 404 | Single semester plan detail | Planning Service |
| [ ] | `PUT` | `/me/roadmap/semesters/{semesterKey}` | Body: `SemesterPlanUpdate` | 200 | Edit a semester plan manually | Planning Service |
| [ ] | `POST` | `/me/roadmap/semesters/{semesterKey}/courses` | Body: `{ courseId }` | 201 | Add a course to a semester plan | Planning Service |
| [ ] | `DELETE` | `/me/roadmap/semesters/{semesterKey}/courses/{courseId}` | — | 204 | Remove a course from a semester plan | Planning Service |

> **Note**: `/generate` may return `202 Accepted` with a status URL when the AI service takes > a few seconds. The client should poll or use SSE to retrieve the final result.

<details>
<summary>Request / response schemas</summary>

**`POST /me/roadmap/generate` — `RoadmapGenerateRequest`**
```json
{
  "aims": ["graduate by SS2026", "specialize in AI"],
  "preferences": {
    "maxCreditsPerSemester": 30,
    "preferredLanguage": "EN"
  },
  "interests": ["machine learning", "computer vision"]
}
```

**`Roadmap`** *(response for GET, PUT, and generate)*
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "aims": ["graduate by SS2026"],
  "preferences": { "maxCreditsPerSemester": 30 },
  "interests": ["machine learning"],
  "semesters": [
    {
      "semesterKey": "SS2025",
      "label": "Summer Semester 2025",
      "totalCredits": 28,
      "status": "CURRENT",
      "courses": [
        {
          "courseId": "uuid",
          "courseCode": "IN2349",
          "courseName": "Advanced Deep Learning",
          "credits": 6,
          "status": "ENROLLED",
          "category": "Elective"
        }
      ]
    }
  ],
  "generatedAt": "2025-05-13T10:00:00Z",
  "updatedAt": "2025-05-13T10:00:00Z"
}
```

**`GET /me/roadmap/semesters/{semesterKey}` — `SemesterPlanDetail`**
```json
{
  "semesterKey": "SS2025",
  "label": "Summer Semester 2025",
  "totalCredits": 28,
  "status": "CURRENT",
  "courses": [
    {
      "courseId": "uuid",
      "courseCode": "IN2349",
      "courseName": "Advanced Deep Learning",
      "credits": 6,
      "status": "ENROLLED",
      "timeSlots": [
        { "day": "MONDAY", "startTime": "10:00", "endTime": "12:00", "room": "MW 0001", "type": "LECTURE" }
      ]
    }
  ],
  "conflicts": []
}
```
</details>

---

### Prerequisite Mapping (AIDAN 6)

| Impl  | Method | Endpoint | Params / Body | Status | Description | Service |
|:-----:| :---: | :--- | :--- | :---: | :--- | :--- |
| [ - ] | `GET` | `/courses/{courseId}/prerequisites` | — | 200 / 404 | Full recursive prerequisite tree for a course | Catalog Service |
| [ - ] | `GET` | `/courses/{courseId}/prerequisites/check` | — (uses auth token) | 200 / 404 | Check if the authenticated student meets all prerequisites | Catalog Service + Student Service |

<details>
<summary>Response schemas</summary>

**`GET /courses/{courseId}/prerequisites` — `PrerequisiteTree`**
```json
{
  "courseId": "uuid",
  "courseCode": "IN2349",
  "courseName": "Advanced Deep Learning",
  "prerequisites": [
    {
      "courseId": "uuid",
      "courseCode": "IN2346",
      "courseName": "Introduction to Deep Learning",
      "type": "REQUIRED",
      "prerequisites": []
    },
    {
      "courseId": "uuid",
      "courseCode": "MA2001",
      "courseName": "Linear Algebra",
      "type": "RECOMMENDED",
      "prerequisites": []
    }
  ]
}
```

**`GET /courses/{courseId}/prerequisites/check` — `PrerequisiteCheck`**
```json
{
  "courseId": "uuid",
  "courseCode": "IN2349",
  "eligible": false,
  "unmetPrerequisites": [
    { "courseId": "uuid", "courseCode": "IN2346", "courseName": "Introduction to Deep Learning", "type": "REQUIRED" }
  ],
  "metPrerequisites": [
    { "courseId": "uuid", "courseCode": "MA2001", "courseName": "Linear Algebra", "type": "RECOMMENDED" }
  ]
}
```
</details>


### Dashboard Aggregation

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/dashboard` | — | 200 | Single aggregated response powering the Dashboard screen (KPIs, alerts, top recommendations, upcoming classes) | Planning Service |

<details>
<summary>Response schema</summary>

**`Dashboard`**
```json
{
  "progress": {
    "totalCreditsEarned": 90,
    "totalCreditsRequired": 120,
    "progressPercentage": 75.0,
    "gpa": 1.85,
    "currentSemester": "SS2025"
  },
  "alerts": [
    {
      "type": "PREREQUISITE_WARNING | DEADLINE | WORKLOAD | CONFLICT",
      "severity": "INFO | WARNING | ERROR",
      "message": "Registration deadline for SS2025 courses is in 3 days",
      "relatedEntityId": "uuid",
      "relatedEntityType": "COURSE | SEMESTER"
    }
  ],
  "recommendations": [
    {
      "courseId": "uuid",
      "courseCode": "IN2390",
      "courseName": "Robot Learning",
      "relevanceScore": 0.92,
      "reason": "Aligns with your interest in robotics"
    }
  ],
  "upcomingCourses": [
    {
      "courseId": "uuid",
      "courseCode": "IN2349",
      "courseName": "Advanced Deep Learning",
      "nextSession": { "day": "MONDAY", "startTime": "10:00", "room": "MW 0001" }
    }
  ],
  "semesterCredits": 28
}
```
</details>

---

### AI Advisor Chat (AIDAN 4 — conversational layer)

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/advisor/conversations` | Query: `page, size` | 200 | List all past conversations | Planning Service |
| [ ] | `POST` | `/me/advisor/conversations` | Body: `{ title? }` | 201 | Start a new conversation | Planning Service |
| [ ] | `GET` | `/me/advisor/conversations/{conversationId}` | — | 200 / 404 | Full conversation with all messages | Planning Service |
| [ ] | `POST` | `/me/advisor/conversations/{conversationId}/messages` | Body: `{ content }` | 200 / SSE | Send a user message; response streams via SSE or returns full JSON | Planning Service + AI Service |

> **Streaming**: Send `Accept: text/event-stream` to receive incremental tokens (drives the typing indicator in the prototype). Default `Accept: application/json` returns the completed reply synchronously.

<details>
<summary>Request / response schemas</summary>

**`POST /me/advisor/conversations/{id}/messages` — request**
```json
{ "content": "What electives should I take next semester?" }
```

**`Conversation`**
```json
{
  "id": "uuid",
  "title": "Course selection for SS2025",
  "createdAt": "2025-05-13T10:00:00Z",
  "updatedAt": "2025-05-13T10:05:00Z",
  "messages": [
    {
      "id": "uuid",
      "role": "USER | ASSISTANT",
      "content": "What electives should I take next semester?",
      "timestamp": "2025-05-13T10:00:00Z",
      "metadata": {
        "referencedCourses": [
          { "courseId": "uuid", "courseCode": "IN2349" }
        ]
      }
    }
  ]
}
```

**`ConversationSummary`** *(item in paginated list)*
```json
{
  "id": "uuid",
  "title": "Course selection for SS2025",
  "lastMessagePreview": "I recommend looking into Robot Learning...",
  "messageCount": 12,
  "createdAt": "2025-05-13T10:00:00Z",
  "updatedAt": "2025-05-13T10:05:00Z"
}
```
</details>

---

### Schedule View (AIDAN 7 — view only)

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/schedule` | Query: `semester` | 200 | Weekly timetable of all enrolled courses for a semester | Planning Service + Student Service |

<details>
<summary>Response schema</summary>

**`WeeklySchedule`**
```json
{
  "semester": "SS2025",
  "events": [
    {
      "courseId": "uuid",
      "courseCode": "IN2349",
      "courseName": "Advanced Deep Learning",
      "type": "LECTURE | TUTORIAL | LAB | EXAM",
      "day": "MONDAY",
      "startTime": "10:00",
      "endTime": "12:00",
      "room": "MW 0001",
      "instructor": "Prof. Niessner",
      "color": "#4A90D9"
    }
  ],
  "totalCredits": 28,
  "conflicts": []
}
```
</details>

---

## Could Have

> Covers: **AIDAN 7** (Scheduling Preferences), **AIDAN 8** (Conflict Resolution), recommendation feedback, advisor extras

---

### Scheduling Preferences (AIDAN 7)

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/preferences/scheduling` | — | 200 | Retrieve personal scheduling constraints | Student Service |
| [ ] | `PUT` | `/me/preferences/scheduling` | Body: `SchedulingPreferences` | 200 | Replace scheduling constraints | Student Service |

<details>
<summary>Request / response schema</summary>

**`SchedulingPreferences`**
```json
{
  "maxCreditsPerSemester": 30,
  "blockedTimeSlots": [
    { "day": "MONDAY", "startTime": "08:00", "endTime": "10:00", "reason": "No morning classes" }
  ],
  "preferredTimeSlots": [
    { "day": "TUESDAY", "startTime": "10:00", "endTime": "18:00" }
  ],
  "preferNoBackToBack": true,
  "preferredLanguage": "EN",
  "maxCoursesPerDay": 3
}
```
</details>

---

### Conflict Resolution (AIDAN 8)

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `GET` | `/me/schedule/conflicts` | Query: `semester` | 200 | All detected conflicts for the current semester plan | Planning Service |

<details>
<summary>Response schema</summary>

**`ConflictList`**
```json
{
  "semester": "SS2025",
  "conflicts": [
    {
      "type": "TIME_OVERLAP | WORKLOAD_EXCEEDED | PREREQUISITE_UNMET",
      "severity": "ERROR | WARNING",
      "message": "IN2349 and IN2390 overlap on Monday 10:00–12:00",
      "involvedCourses": ["uuid-a", "uuid-b"]
    }
  ]
}
```
</details>

---

### Recommendation Feedback

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `POST` | `/me/recommendations/{courseId}/feedback` | Body: `{ action }` | 204 | Record student reaction to a recommendation (save / dismiss / enroll) | Student Service |

<details>
<summary>Request schema</summary>

```json
{ "action": "SAVE | DISMISS | ENROLL" }
```
</details>

---

### Advisor Extras

| Impl | Method | Endpoint | Params / Body | Status | Description | Service |
| :---: | :---: | :--- | :--- | :---: | :--- | :--- |
| [ ] | `DELETE` | `/me/advisor/conversations/{conversationId}` | — | 204 | Delete a conversation | Planning Service |
| [ ] | `GET` | `/me/advisor/suggestions` | — | 200 | Suggested quick-prompt chips for the advisor screen | Planning Service + AI Service |

<details>
<summary>Response schema</summary>

**`SuggestedPrompt[]`**
```json
[
  { "text": "What electives should I take next semester?", "category": "RECOMMENDATIONS" },
  { "text": "Am I on track to graduate by SS2026?",        "category": "SCHEDULE" },
  { "text": "Show me courses that don't clash with Mondays.", "category": "SCHEDULE" },
  { "text": "What prerequisites am I still missing?",      "category": "PREREQUISITES" }
]
```
</details>

---

## Implementation Phasing

### Sprint 1–2 — Must Have
1. Health endpoints — validates CI/CD pipeline end-to-end
2. Auth endpoints — unblocks all authenticated work
3. `GET /me` (basic profile) — foundational identity
4. `GET /courses` (with `ai=true` for semantic search), `GET /courses/{id}` — catalog browsing
5. `GET /departments`, `GET /study-programs*` — catalog metadata
6. `GET /me/progress`, completed/enrolled CRUD — academic tracking
7. `GET /me/requirements` — degree requirement check
8. `POST /me/transcript/upload` — transcript import

### Sprint 3–4 — Should Have
1. `PUT/PATCH /me` — full profile editing
2. Prerequisite tree + check — AIDAN 6
3. `GET/POST /me/recommendations` — AIDAN 4
4. Roadmap CRUD + `/generate` — AIDAN 5
5. `GET /me/dashboard` — dashboard aggregation
6. Advisor conversations + message send (SSE) — chat UI
7. `GET /me/schedule` — timetable view

### Sprint 5+ — Could Have
1. Scheduling preferences (`GET/PUT`)
2. Conflict detection (`GET /me/schedule/conflicts`)
3. Recommendation feedback
4. Advisor conversation deletion + suggestions
