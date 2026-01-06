#!/bin/sh
set -eu

# 注意:
# - 復元はデータ破壊的です（DB全体を上書きし得る）。
# - 本番で使う前に必ず検証してください。

dump_file=${1-}
if [ -z "$dump_file" ] || [ ! -f "$dump_file" ]; then
  echo "usage: $0 /absolute/path/to/xxx.dump" >&2
  exit 2
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
root_dir=$(CDPATH= cd -- "$script_dir/.." && pwd -P)

if [ "${CONFIRM_RESTORE-}" != "YES" ]; then
  echo "Refusing to restore. Set CONFIRM_RESTORE=YES to proceed." >&2
  exit 3
fi

# restore は postgres:18-alpine の pg_restore を利用
# - clean: 既存オブジェクトを削除して復元
# - if-exists: あるときだけ削除

docker compose \
  -f "$root_dir/docker-compose.infra.yml" \
  -f "$root_dir/docker-compose.restore-helper.yml" \
  run --rm \
  -e RESTORE_DUMP="/dump/$(basename -- "$dump_file")" \
  -v "$dump_file:/dump/$(basename -- "$dump_file"):ro" \
  postgres-restore \
  sh -lc 'set -eu; echo "[info] restoring $RESTORE_DUMP"; pg_restore -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-pecus}" -d "${POSTGRES_DB:-pecusdb}" --clean --if-exists "$RESTORE_DUMP"; echo "[ok] restore finished"'
