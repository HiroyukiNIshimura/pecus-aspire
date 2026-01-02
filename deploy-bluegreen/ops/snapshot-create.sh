#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# スナップショット作成スクリプト
# 現在稼働中の DB と Docker イメージをセットでスナップショット（1世代のみ保持）
#
# 使い方:
#   ./snapshot-create.sh

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker
require_cmd jq

snapshot_dir="${DATA_PATH:?DATA_PATH is required}/snapshot"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)

echo "[情報] スナップショット作成開始"

current=$(active_slot)
echo "[情報] アクティブスロット: $current"

git_commit=$(git -C "$repo_root" rev-parse --short HEAD 2>/dev/null || echo "unknown")

# 既存スナップショットを削除
if [[ -d "$snapshot_dir" ]]; then
  echo "[情報] 既存スナップショットを削除..."
  for svc in webapi frontend backfire lexicalconverter; do
    docker rmi "coati-$svc:snapshot-latest" 2>/dev/null || true
  done
  rm -rf "$snapshot_dir"
fi

mkdir -p "$snapshot_dir"

echo "[情報] DBバックアップ実行..."
compose \
  -f "$bluegreen_dir/docker-compose.backup.yml" \
  run --rm pgbackup

db_dump=$(ls -1t "${DATA_PATH}/backups/postgres/"*.dump 2>/dev/null | head -1)
if [[ -z "$db_dump" ]]; then
  echo "[エラー] DBバックアップが見つかりません" >&2
  exit 1
fi
cp "$db_dump" "$snapshot_dir/db.dump"

echo "[情報] イメージにスナップショットタグを付与..."
for svc in webapi frontend backfire; do
  src_image="coati-$svc-$current:local"
  if docker image inspect "$src_image" >/dev/null 2>&1; then
    docker tag "$src_image" "coati-$svc:snapshot-latest"
    echo "  $src_image → coati-$svc:snapshot-latest"
  else
    echo "[警告] イメージが見つかりません: $src_image"
  fi
done

if docker image inspect "coati-lexicalconverter:local" >/dev/null 2>&1; then
  docker tag "coati-lexicalconverter:local" "coati-lexicalconverter:snapshot-latest"
  echo "  coati-lexicalconverter:local → coati-lexicalconverter:snapshot-latest"
fi

echo "[情報] メタデータ保存..."
cat > "$snapshot_dir/metadata.json" <<EOF
{
  "created_at": "$timestamp",
  "git_commit": "$git_commit",
  "active_slot": "$current"
}
EOF

echo "[OK] スナップショット作成完了"
jq . "$snapshot_dir/metadata.json"
