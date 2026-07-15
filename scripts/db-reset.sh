#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${GREEN}[db-reset]${NC} $*"; }
err() { echo -e "${RED}[db-reset]${NC} $*" >&2; }

echo -e "${RED}This will stop ALL containers and delete ALL volumes (including course seed data).${NC}"
echo "The ~100MB courses-data seed will need to be re-imported on next db-start."
echo ""
read -rp "Continue? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

cd "$SCRIPT_DIR"

log "Stopping containers..."
docker compose down --remove-orphans 2>/dev/null || true

log "Removing volumes..."
docker compose down -v 2>/dev/null || true

log "Done. All containers and volumes removed."
log "Run ./scripts/db-start.sh to re-initialize."
