#!/usr/bin/env bash
set -euo pipefail

# Keep this list as the single source of truth for both deterministic and live GenAI evaluation.
base_ref="${1:?base ref required}"
head_ref="${2:?head ref required}"

while IFS= read -r path; do
  case "$path" in
    services/genai/*|services/server/src/main/java/tum/devops/http418/api/APIControllerMe*.java|services/server/src/main/java/tum/devops/http418/api/dto/*|services/server/src/main/java/tum/devops/http418/data/CoursesDataDB.java|services/server/src/main/java/tum/devops/http418/data/StudentDataDB.java|services/user-profile-service/*|services/scraper/*|infra/db/init/*|.github/workflows/ci.yml|.github/workflows/cd-preview.yml|.github/workflows/cd.yml|.github/workflows/genai-golden-eval.yml|.github/actions/genai-quality-filter/*|scripts/genai-quality-changed.sh|scripts/audit_genai_catalog.py)
      echo true
      exit 0
      ;;
  esac
done < <(git diff --name-only "$base_ref" "$head_ref")
echo false
