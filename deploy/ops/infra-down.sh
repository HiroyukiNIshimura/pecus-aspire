#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# Infra only down. Refuses if app containers are still running.

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

running_app_containers=$(docker ps --format '{{.Names}}' | grep -E '^pecus-(webapi|frontend|backfire)-(blue|green)$' || true)
if [[ -n "$running_app_containers" ]]; then
  echo "[エラー] アプリコンテナがまだ稼働中です。先にアプリを停止してください:" >&2
  echo "$running_app_containers" >&2
  exit 2
fi

compose_infra down

echo "[OK] インフラ停止完了"