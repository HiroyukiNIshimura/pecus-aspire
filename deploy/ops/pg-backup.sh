#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

compose \
  -f "$bluegreen_dir/docker-compose.infra.yml" \
  -f "$bluegreen_dir/docker-compose.backup.yml" \
  run --rm pgbackup

echo "[OK] バックアップ完了"