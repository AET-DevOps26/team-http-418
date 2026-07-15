#!/usr/bin/env bash
# Deploy the production Compose stack without allowing applications to start
# against an unseeded or partially seeded courses database.
set -Eeuo pipefail

cd "$(dirname "$0")/.."

application_services=(server client user-profile-service pdf-parser genai postgres-exporter prometheus grafana promtail loki cadvisor)

docker compose pull
docker compose stop "${application_services[@]}" || true
docker compose up -d db

for _ in {1..30}; do
  if docker compose exec -T db pg_isready -U "${DB_USER:-postgres}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
docker compose exec -T db pg_isready -U "${DB_USER:-postgres}" >/dev/null

docker compose run --rm db-seed
docker compose up -d --remove-orphans
