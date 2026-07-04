#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_PORT="${SERVER_PORT:-8080}"
READY_TIMEOUT="${READY_TIMEOUT:-180}"

# ── Colors ───────────────────────────────────────────────────────────────────
MAGENTA='\033[0;35m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

log()     { echo -e "${NC}[dev]${NC} $*"; }
log_db()  { echo -e "${MAGENTA}[db]${NC} $*"; }
log_srv() { echo -e "${BLUE}[server]${NC} $*"; }
log_cli() { echo -e "${GREEN}[client]${NC} $*"; }
log_gen() { echo -e "${YELLOW}[genai]${NC} $*"; }
log_scr() { echo -e "${CYAN}[scraper]${NC} $*"; }
err()     { echo -e "${RED}Error:${NC} $*" >&2; }

# ── Flags ────────────────────────────────────────────────────────────────────
START_DB=false
START_SERVER=false
START_CLIENT=false
START_GENAI=false
START_SCRAPER=false
START_PROFILE=false
WE_STARTED_DB=false

usage() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --db       Start database container"
  echo "  --server   Start Spring Boot server (auto-starts db)"
  echo "  --client   Start frontend dev server"
  echo "  --genai    Start GenAI FastAPI service"
  echo "  --scraper  Run scraper one-shot (auto-starts db)"
  echo "  --all      Start db + server + client + genai"
  echo "  --help     Show this message"
  exit 0
}

if [ $# -eq 0 ]; then
  usage
fi

for arg in "$@"; do
    case $arg in
      --db)      START_DB=true ;;
      --server)  START_SERVER=true ;;
      --client)  START_CLIENT=true ;;
      --genai)   START_GENAI=true ;;
      --scraper) START_SCRAPER=true ;;
      --all)
        START_DB=true; START_SERVER=true
        START_CLIENT=true; START_GENAI=true ;;
      --help|-h) usage ;;
      *) err "Unknown flag: $arg"; usage ;;
    esac
done

# Auto-deps
$START_SERVER  && START_DB=true
$START_SERVER  && START_PROFILE=true
$START_SCRAPER && START_DB=true
$START_PROFILE && START_DB=true

# ── Prerequisite checks ──────────────────────────────────────────────────────
check_cmd() { command -v "$1" &>/dev/null || { err "'$1' not found in PATH."; exit 1; }; }
$START_DB     && check_cmd docker
$START_SERVER  && { [ -f "$SCRIPT_DIR/services/server/gradlew" ] || { err "services/server/gradlew not found. Run 'gradle wrapper' in services/server/."; exit 1; }; }
$START_PROFILE && { [ -f "$SCRIPT_DIR/services/user-profile-service/gradlew" ] || { err "services/user-profile-service/gradlew not found."; exit 1; }; }
$START_CLIENT && check_cmd pnpm
{ $START_GENAI || $START_SCRAPER; } && check_cmd python3

# ── Load .env + local dev overrides ─────────────────────────────────────────
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/.env"
  set +a
fi
# Override docker-network hostnames with localhost for native services
export DB_HOST=localhost
export DB_PORT="${DB_PORT:-5432}"
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:${DB_PORT}"
export GENAI_BASE_URL="http://localhost:8000"
export GENAI_SERVICE_URL="http://localhost:8000/v1"
export PROFILE_SERVICE_URL="http://localhost:8060/v1"
export PDF_PARSER_SERVICE_URL="http://localhost:8070/v1"

# ── Shutdown trap ────────────────────────────────────────────────────────────
PIDS=()
cleanup() {
  echo
  log "Shutting down..."
  for pid in "${PIDS[@]:-}"; do
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  if $WE_STARTED_DB; then
    log_db "Stopping db container..."
    (cd "$SCRIPT_DIR" && docker compose stop db 2>/dev/null) || true
  fi
}
trap cleanup EXIT INT TERM

# ── venv helper ──────────────────────────────────────────────────────────────
ensure_venv() {
  local dir="$1"
  local venv_dir
  if   [ -d "$dir/.venv" ]; then venv_dir="$dir/.venv"
  elif [ -d "$dir/venv"  ]; then venv_dir="$dir/venv"
  else
    log "Creating venv in $dir/.venv" >&2
    python3 -m venv "$dir/.venv"
    venv_dir="$dir/.venv"
  fi
  if [ -f "$dir/requirements.txt" ]; then
    "$venv_dir/bin/pip" install -q --only-binary=psycopg2-binary -r "$dir/requirements.txt"
  fi
  echo "$venv_dir"
}

# ── db ───────────────────────────────────────────────────────────────────────
if $START_DB; then
  log_db "Starting db container..."
  (cd "$SCRIPT_DIR" && docker compose up -d db)
  WE_STARTED_DB=true
  log_db "Waiting for db healthcheck..."
  container_id=$(cd "$SCRIPT_DIR" && docker compose ps -q db 2>/dev/null)
  for i in $(seq 1 60); do
    status=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "")
    if [ "$status" = "healthy" ]; then
      log_db "DB healthy after ${i}s."; break
    fi
    sleep 1
    if [ "$i" -eq 60 ]; then
      err "DB did not become healthy within 60s."; exit 1
    fi
  done
fi

# ── user-profile-service ─────────────────────────────────────────────────────
PROFILE_PORT=8060
if $START_PROFILE; then
  log_srv "Starting user-profile-service on :$PROFILE_PORT..."
  (cd "$SCRIPT_DIR/services/user-profile-service" && SERVER_PORT=$PROFILE_PORT ./gradlew bootRun --console=plain) &
  PROFILE_PID=$!
  PIDS+=("$PROFILE_PID")
  log_srv "Waiting for user-profile-service on :$PROFILE_PORT (up to ${READY_TIMEOUT}s)..."
  for i in $(seq 1 "$READY_TIMEOUT"); do
    if ! kill -0 "$PROFILE_PID" 2>/dev/null; then
      err "user-profile-service exited before becoming ready."; exit 1
    fi
    if nc -z localhost "$PROFILE_PORT" 2>/dev/null; then
      log_srv "user-profile-service ready after ${i}s."; break
    fi
    sleep 1
    if [ "$i" -eq "$READY_TIMEOUT" ]; then
      err "user-profile-service not ready within ${READY_TIMEOUT}s."; exit 1
    fi
  done
fi

# ── server ───────────────────────────────────────────────────────────────────
if $START_SERVER; then
  log_srv "Starting Spring Boot on :$SERVER_PORT..."
  (cd "$SCRIPT_DIR/services/server" && ./gradlew bootRun --console=plain) &
  SERVER_PID=$!
  PIDS+=("$SERVER_PID")
  log_srv "Waiting for backend on :$SERVER_PORT (up to ${READY_TIMEOUT}s)..."
  for i in $(seq 1 "$READY_TIMEOUT"); do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      err "Server exited before becoming ready."; exit 1
    fi
    if nc -z localhost "$SERVER_PORT" 2>/dev/null; then
      log_srv "Backend ready after ${i}s."; break
    fi
    sleep 1
    if [ "$i" -eq "$READY_TIMEOUT" ]; then
      err "Backend not ready within ${READY_TIMEOUT}s."; exit 1
    fi
  done
fi

# ── genai ────────────────────────────────────────────────────────────────────
if $START_GENAI; then
  log_gen "Setting up genai venv..."
  venv=$(ensure_venv "$SCRIPT_DIR/services/genai")
  log_gen "Starting genai on :8000..."
  (cd "$SCRIPT_DIR/services/genai" && "$venv/bin/uvicorn" main:app --reload --port 8000) &
  PIDS+=($!)
fi

# ── client ───────────────────────────────────────────────────────────────────
if $START_CLIENT; then
  log_cli "Starting client dev server..."
  (cd "$SCRIPT_DIR/services/client" && pnpm install && pnpm dev) &
  PIDS+=($!)
fi

# ── scraper (one-shot) ───────────────────────────────────────────────────────
if $START_SCRAPER; then
  log_scr "Setting up scraper venv..."
  venv=$(ensure_venv "$SCRIPT_DIR/services/scraper")
  log_scr "Running scraper..."
  (cd "$SCRIPT_DIR/services/scraper" && "$venv/bin/python" main.py)
  log_scr "Scraper finished."
fi

# Wait on background services
if [ ${#PIDS[@]} -gt 0 ]; then
  wait "${PIDS[@]}"
fi
