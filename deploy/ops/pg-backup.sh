#!/bin/sh
set -eu

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

echo "[Info] Starting backup..."

# バックアップディレクトリの事前チェック
backup_dir="${DATA_PATH}/backups/postgres"
if [ ! -d "$backup_dir" ]; then
  echo "[Error] バックアップディレクトリが存在しません: $backup_dir" >&2
  echo "        sudo setup-data-dirs.sh を実行してください" >&2
  exit 1
fi
if [ ! -w "$backup_dir" ]; then
  echo "[Error] バックアップディレクトリに書き込み権限がありません: $backup_dir" >&2
  echo "        所有者を確認してください: ls -la $backup_dir" >&2
  exit 1
fi

# shellcheck disable=SC2154
compose \
  -f "$bluegreen_dir/docker-compose.infra.yml" \
  -f "$bluegreen_dir/docker-compose.backup.yml" \
  run --rm pgbackup

echo "[OK] Backup finished."
echo "${DATA_PATH}/backups/postgres/ にバックアップファイルが保存されました。"
echo ""
echo "[Info] Backup files:"
ls -lh "${DATA_PATH}/backups/postgres/"