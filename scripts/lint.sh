#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

FAILED=0

run() {
  local label="$1"
  shift
  echo -e "${CYAN}[$label]${NC} $*"
  if "$@"; then
    echo -e "${GREEN}[$label]${NC} ✓ passed"
  else
    echo -e "${RED}[$label]${NC} ✗ failed"
    FAILED=1
  fi
  echo
}

# ── Client (biome) ──────────────────────────────────────────────────────────
echo "═══ Client ═══"
pushd "$SCRIPT_DIR/services/client" > /dev/null
CI=true pnpm install --frozen-lockfile --silent 2>/dev/null || true
run "client:check" pnpm check
popd > /dev/null

# ── Server (spotless) ──────────────────────────────────────────────────────
echo "═══ Server ═══"
pushd "$SCRIPT_DIR/services/server" > /dev/null
chmod +x gradlew
run "server:spotless" ./gradlew spotlessCheck --quiet
popd > /dev/null

# ── PDF Parser (spotless) ──────────────────────────────────────────────────
echo "═══ PDF Parser ═══"
pushd "$SCRIPT_DIR/services/pdf-parser" > /dev/null
chmod +x gradlew
run "pdf-parser:spotless" ./gradlew spotlessCheck --quiet
popd > /dev/null

# ── User Profile Service (spotless) ────────────────────────────────────────
echo "═══ User Profile Service ═══"
pushd "$SCRIPT_DIR/services/user-profile-service" > /dev/null
chmod +x gradlew
run "user-profile:spotless" ./gradlew spotlessCheck --quiet
popd > /dev/null

# ── GenAI (ruff) ───────────────────────────────────────────────────────────
echo "═══ GenAI ═══"
pushd "$SCRIPT_DIR/services/genai" > /dev/null
run "genai:format" ruff format --check .
run "genai:lint"   ruff check .
popd > /dev/null

# ── Scraper (ruff) ─────────────────────────────────────────────────────────
echo "═══ Scraper ═══"
pushd "$SCRIPT_DIR/services/scraper" > /dev/null
run "scraper:format" ruff format --check .
run "scraper:lint"   ruff check .
popd > /dev/null

# ── Summary ────────────────────────────────────────────────────────────────
echo "════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}All checks passed.${NC}"
else
  echo -e "${RED}Some checks failed.${NC}"
  exit 1
fi
