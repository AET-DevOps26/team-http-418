#!/usr/bin/env bash
set -Eeuo pipefail

# Translate the container's POSTGRES_* environment into the DB_* inputs
# that seed-courses requires. During first-volume initialization PostgreSQL
# sets POSTGRES_USER and POSTGRES_PASSWORD but the seed script expects DB_*.
export DB_USER="${DB_USER:-$POSTGRES_USER}"
export DB_PASS="${DB_PASS:-$POSTGRES_PASSWORD}"
export DB_PORT="${DB_PORT:-5432}"
export COURSES_DB_NAME="${COURSES_DB_NAME:-courses-data}"

/usr/local/bin/seed-courses
