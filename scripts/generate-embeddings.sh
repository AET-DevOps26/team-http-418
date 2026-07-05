#!/bin/bash
set -euo pipefail

# Generate course embeddings by pulling courses from DB and sending them to the GenAI embedding endpoint.
# Requires: genai service running on :8000, DB running with courses-data populated.

GENAI_URL="${GENAI_URL:-http://localhost:8000/v1}"
BATCH_SIZE=50

echo "[embed] Fetching courses without embeddings..."
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COURSES_JSON=$(cd "$SCRIPT_DIR" && docker compose exec -T db psql -U postgres -d courses-data -t -A \
  -c "SELECT json_agg(json_build_object('courseId', c.id, 'courseName', c.title_en, 'description', c.description_en, 'department', o.name_en)) FROM courses c LEFT JOIN organizations o ON c.organization_id = o.id WHERE c.title_en IS NOT NULL AND c.id NOT IN (SELECT course_id FROM course_embeddings)" \
  2>/dev/null | head -1)

if [ "$COURSES_JSON" = "" ] || [ "$COURSES_JSON" = "null" ]; then
  echo "[embed] All courses already have embeddings. Nothing to do."
  exit 0
fi

TOTAL=$(echo "$COURSES_JSON" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
echo "[embed] Found $TOTAL courses with English titles"

echo "[embed] Sending in batches of $BATCH_SIZE (with retry on failure)..."
echo "$COURSES_JSON" | python3 -c "
import sys, json, urllib.request, time

courses = json.load(sys.stdin)
batch_size = $BATCH_SIZE
url = '$GENAI_URL/embeddings/courses'
total = len(courses)
embedded = 0
num_batches = (total + batch_size - 1) // batch_size

for i in range(0, total, batch_size):
    batch = courses[i:i+batch_size]
    batch_num = i // batch_size + 1
    payload = json.dumps({'courses': batch, 'mode': 'UPSERT'}).encode()

    for attempt in range(1, 4):
        try:
            req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
            resp = urllib.request.urlopen(req, timeout=120)
            result = json.loads(resp.read())
            embedded += result.get('embedded', 0)
            print(f'[embed] Batch {batch_num}/{num_batches}: {embedded}/{total} embedded')
            break
        except Exception as e:
            if attempt < 3:
                wait = 2 ** attempt
                print(f'[embed] Batch {batch_num} attempt {attempt} failed ({e}), retrying in {wait}s...')
                time.sleep(wait)
            else:
                print(f'[embed] Batch {batch_num} failed after 3 attempts: {e}')

print(f'[embed] Done. {embedded}/{total} courses embedded.')
"
