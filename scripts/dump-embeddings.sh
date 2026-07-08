#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$SCRIPT_DIR/infra/db/init/embeddings-data.sql.gz.data"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${GREEN}[embed-dump]${NC} $*"; }
err() { echo -e "${RED}Error:${NC} $*" >&2; }

cd "$SCRIPT_DIR"

COUNT=$(docker compose exec -T db psql -U postgres -d courses-data -t -A \
  -c "SELECT count(*) FROM course_embeddings" 2>/dev/null || echo "0")
COUNT=$(echo "$COUNT" | tr -d '[:space:]')

if [ "$COUNT" = "0" ] || [ "$COUNT" = "" ]; then
  err "No embeddings found in course_embeddings table."
  echo "Generate embeddings first (requires genai service + eduVPN):"
  echo "  ./scripts/generate-embeddings.sh"
  exit 1
fi

log "Dumping $COUNT course embeddings..."
docker compose exec -T db pg_dump -U postgres -d courses-data \
  --table=course_embeddings --data-only --no-owner --no-privileges \
  | gzip > "$OUTPUT"

SIZE=$(du -h "$OUTPUT" | cut -f1)
log "Done. Wrote $OUTPUT ($SIZE)"
log "Commit this file to include embeddings in DB seed data."
