# Transcript Analysis Pipeline

## Overview

Transcripts are downloaded directly from TUM and are 100% reliable. The scraped course catalog is not. This pipeline treats transcript data as ground truth: courses are always kept, linked to the catalog when possible, and preserved with their original data (moduleId, ECTS, grade, name) when linking fails.

## Pipeline Flow

```
PDF Upload → PDF Parser (Tabula) → List<Module>
  → DB fuzzy match (exact title or moduleId pattern)
    → matched: status='pending', course_id set
    → unmatched: inserted as 'unmatched', course_id=NULL
  → Auto AI match for all unmatched (embedding similarity via GenAI)
    → AI matched: promoted to 'pending', course_id set
    → still unmatched: stays as 'unmatched'
  → User reviews, can manually resolve/skip
  → User clicks "Finish Import":
    → pending → confirmed
    → unmatched → confirmed (KEPT with course_id=NULL)
    → skipped → deleted (user explicitly rejected)
```

## Three Matching Tiers

1. **DB match**: Exact title or moduleId pattern against scraped catalog. Fastest, most reliable.
2. **Auto AI match**: Embedding similarity via GenAI `/transcript/match` endpoint. Runs automatically after upload for all unmatched modules. If GenAI is down, upload still succeeds — modules stay unmatched.
3. **Keep as unlinked**: Courses that don't match anything are confirmed with `course_id=NULL`. They retain moduleId, ECTS, grade, and name from the transcript.

## How Unlinked Courses Participate

| Feature | Behavior |
|---------|----------|
| Credit sums | Included via `SUM(credits) WHERE status='confirmed'` |
| GPA | Included via `AVG(grade) WHERE status='confirmed'` |
| Credits by category | Grouped under "Uncategorized" via `COALESCE(category, 'Uncategorized')` |
| Completed courses list | Shown with moduleId as courseCode, moduleTitle as courseName |
| Advisor payload | Included with module data fallback |
| Roadmap payload | Included with module data fallback |
| Prerequisite checking | Excluded — `getCompletedCourseIds` filters `course_id IS NOT NULL` |

## Schema Details

Table: `student_completed_courses`

Relevant constraints:
- `uq_completed_course`: Partial unique index on `(username, course_id) WHERE course_id IS NOT NULL` — allows multiple NULL course_id rows
- `uq_unmatched_module`: Partial unique index on `(username, module_id) WHERE course_id IS NULL` — prevents duplicate unlinked modules per user

No schema migration was needed for this change.

## Tuning

AI match score threshold: `0.5` in `services/genai/services/transcript.py`. Lower values match more aggressively (more false positives); higher values are more conservative (more unlinked courses).
