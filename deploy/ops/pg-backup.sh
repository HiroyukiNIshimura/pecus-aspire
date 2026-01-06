#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

echo "[Info] Starting backup..."

compose \
  -f "$bluegreen_dir/docker-compose.infra.yml" \
  -f "$bluegreen_dir/docker-compose.backup.yml" \
  run --rm pgbackup

echo "[OK] Backup finished."