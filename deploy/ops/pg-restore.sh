#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# usage: CONFIRM_RESTORE=YES ./pg-restore.sh /absolute/path/to/xxx.dump

dump_file=${1-}
if [[ -z "$dump_file" || ! -f "$dump_file" ]]; then
  echo "使用方法: $0 /absolute/path/to/xxx.dump" >&2
  exit 2
fi

if [[ "${CONFIRM_RESTORE-}" != "YES" ]]; then
  echo "[エラー] リストアを拒否しました。続行するには CONFIRM_RESTORE=YES を設定してください。" >&2
  exit 3
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

compose \
  -f "$bluegreen_dir/docker-compose.infra.yml" \
  -f "$bluegreen_dir/docker-compose.restore-helper.yml" \
  run --rm \
  -e RESTORE_DUMP="/dump/$(basename -- "$dump_file")" \
  -v "$dump_file:/dump/$(basename -- "$dump_file"):ro" \
  postgres-restore \
  sh -lc 'set -eu; echo "[情報] リストア中: $RESTORE_DUMP"; pg_restore -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-pecus}" -d "${POSTGRES_DB:-pecusdb}" --clean --if-exists "$RESTORE_DUMP"; echo "[OK] リストア完了"'
