#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# DB destructive reset + migrate (DB_RESET_MODE=true)

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

# インフラが起動しているか確認 (最低限 postgres と lexicalconverter)
wait_health pecus-postgres 10 >/dev/null || {
  echo "[エラー] インフラが停止しています。先に infra-up.sh を実行してください。" >&2
  exit 2
}
wait_health pecus-lexicalconverter 10 >/dev/null || {
  echo "[エラー] インフラが停止しています。先に infra-up.sh を実行してください。" >&2
  exit 2
}

# 確認
# - 対話式: ./db-reset-migrate.sh
# - スキップ: ./db-reset-migrate.sh -y
if [[ "${1:-}" != "-y" ]]; then
  confirm_yes "DBをリセットしてマイグレーションを実行します。"
fi

# 前回の dbmanager コンテナが残っていれば削除
if docker ps -a --format '{{.Names}}' | grep -qx 'pecus-dbmanager'; then
  docker rm -f pecus-dbmanager >/dev/null 2>&1 || true
fi

compose_migrate run --rm -e DB_RESET_MODE=true dbmanager

echo "[OK] DBリセット+マイグレーション完了"