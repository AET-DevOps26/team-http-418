#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[reset]${NC} $*"; }
warn() { echo -e "${YELLOW}[reset]${NC} $*"; }
err()  { echo -e "${RED}[reset]${NC} $*" >&2; }

echo -e "${RED}This will stop all containers and delete all volumes (including database data).${NC}"
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
