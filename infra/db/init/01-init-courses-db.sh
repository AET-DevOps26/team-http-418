#!/usr/bin/env bash
set -Eeuo pipefail

# Fresh volumes use the same guarded command as existing-volume migrations.
/usr/local/bin/seed-courses
