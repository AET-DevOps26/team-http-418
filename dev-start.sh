#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$SCRIPT_DIR/server/gradlew" ]; then
  echo "Error: server/gradlew not found. Run 'gradle wrapper' in server/ first." >&2
  exit 1
fi

cleanup() {
  echo "Shutting down..."
  kill "$SERVER_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting Spring Boot server..."
(cd "$SCRIPT_DIR/server" && ./gradlew bootRun) &
SERVER_PID=$!

echo "Starting client dev server..."
cd "$SCRIPT_DIR/client" && pnpm dev
