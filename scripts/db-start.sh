#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

MAGENTA='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m'

log_db() { echo -e "${MAGENTA}[db]${NC} $*"; }
err()    { echo -e "${RED}Error:${NC} $*" >&2; }

command -v docker &>/dev/null || { err "'docker' not found in PATH."; exit 1; }

if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/.env"
  set +a
fi

log_db "Starting database container (foreground)..."
log_db "First run will import ~100MB seed data — this takes a few minutes."
log_db "Press Ctrl+C to stop."
echo ""

cd "$SCRIPT_DIR"
exec docker compose up --build db
