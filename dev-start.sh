#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_PORT="${SERVER_PORT:-8080}"
READY_TIMEOUT="${READY_TIMEOUT:-180}"

if [ ! -f "$SCRIPT_DIR/server/gradlew" ]; then
  echo "Error: server/gradlew not found. Run 'gradle wrapper' in server/ first." >&2
  exit 1
fi

SERVER_PID=""
cleanup() {
  echo
  echo "Shutting down..."
  if [ -n "$SERVER_PID" ]; then
    pkill -P "$SERVER_PID" 2>/dev/null || true
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting Spring Boot server on :$SERVER_PORT..."
(cd "$SCRIPT_DIR/server" && ./gradlew bootRun --console=plain) &
SERVER_PID=$!

echo "Waiting for backend on :$SERVER_PORT (up to ${READY_TIMEOUT}s)..."
for i in $(seq 1 "$READY_TIMEOUT"); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Error: server process exited before becoming ready." >&2
    exit 1
  fi
  if nc -z localhost "$SERVER_PORT" 2>/dev/null; then
    echo "Backend ready after ${i}s."
    break
  fi
  sleep 1
  if [ "$i" -eq "$READY_TIMEOUT" ]; then
    echo "Error: backend did not become ready within ${READY_TIMEOUT}s." >&2
    exit 1
  fi
done

echo "Starting client dev server..."
cd "$SCRIPT_DIR/client" && pnpm dev
