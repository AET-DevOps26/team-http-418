#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[reset]${NC} $*"; }
err() { echo -e "${RED}[reset]${NC} $*" >&2; }

if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/.env"
  set +a
fi

cd "$SCRIPT_DIR"

if ! docker compose ps --status running db 2>/dev/null | grep -q db; then
  err "DB container not running. Start it first: ./scripts/db-start.sh"
  exit 1
fi

echo -e "${YELLOW}This will drop the 'security' and 'profiles' databases.${NC}"
echo "All user accounts, enrollments, conversations, roadmaps, and profiles will be deleted."
echo -e "${GREEN}Course data (courses-data) will NOT be affected.${NC}"
echo ""
read -rp "Continue? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

log "Dropping 'security' database..."
docker compose exec -T db \
  psql -U "${DB_USER:-postgres}" -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'security' AND pid <> pg_backend_pid();
  " >/dev/null 2>&1 || true
docker compose exec -T db \
  psql -U "${DB_USER:-postgres}" -c "DROP DATABASE IF EXISTS security;"

log "Dropping 'profiles' database..."
docker compose exec -T db \
  psql -U "${DB_USER:-postgres}" -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = 'profiles' AND pid <> pg_backend_pid();
  " >/dev/null 2>&1 || true
docker compose exec -T db \
  psql -U "${DB_USER:-postgres}" -c "DROP DATABASE IF EXISTS profiles;"

log "Done. User data cleared. Course data preserved."
log "Restart services to recreate empty databases."
