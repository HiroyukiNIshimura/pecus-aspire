#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# スナップショットからのリカバリスクリプト
# DB と Docker イメージをスナップショットから復元し、非アクティブスロットに展開
#
# 使い方:
#   ./snapshot-restore.sh

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker
require_cmd jq

snapshot_dir="${DATA_PATH:?DATA_PATH is required}/snapshot"
meta="$snapshot_dir/metadata.json"
db_dump="$snapshot_dir/db.dump"

if [[ ! -f "$meta" ]] || [[ ! -f "$db_dump" ]]; then
  echo "[エラー] スナップショットが見つかりません" >&2
  echo "        先に snapshot-create.sh を実行してください" >&2
  exit 1
fi

echo "[情報] スナップショット情報:"
jq . "$meta"
echo ""

# イメージの存在確認
missing_images=()
for svc in webapi frontend backfire; do
  if ! docker image inspect "coati-$svc:snapshot-latest" >/dev/null 2>&1; then
    missing_images+=("coati-$svc:snapshot-latest")
  fi
done

if [[ ${#missing_images[@]} -gt 0 ]]; then
  echo "[エラー] スナップショットイメージが見つかりません:" >&2
  for img in "${missing_images[@]}"; do
    echo "  - $img" >&2
  done
  exit 1
fi

confirm_yes "リストアはDBを上書きし、アプリを切り替えます。"

# 非アクティブスロットにリストア
current=$(active_slot)
[[ "$current" == "blue" ]] && target="green" || target="blue"

echo "[情報] リストア先スロット: $target (現在: $current)"

echo "[情報] 1. $target スロットを停止..."
compose_app "$target" down 2>/dev/null || true

echo "[情報] 2. スナップショットイメージを復元..."
for svc in webapi frontend backfire; do
  docker tag "coati-$svc:snapshot-latest" "coati-$svc-$target:local"
  echo "  coati-$svc:snapshot-latest → coati-$svc-$target:local"
done

echo "[情報] 3. DBリストア..."
compose \
  -f "$bluegreen_dir/docker-compose.restore-helper.yml" \
  run --rm \
  -e RESTORE_DUMP="/dump/db.dump" \
  -v "$db_dump:/dump/db.dump:ro" \
  postgres-restore \
  sh -lc 'set -eu; echo "[情報] リストア中..."; pg_restore -h "${POSTGRES_HOST:-postgres}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-pecus}" -d "${POSTGRES_DB:-pecusdb}" --clean --if-exists "$RESTORE_DUMP"; echo "[OK] DBリストア完了"'

echo "[情報] 4. $target スロット起動..."
compose_app "$target" up -d "pecusapi-$target" "frontend-$target"
wait_health "pecus-webapi-$target" 300
wait_running "pecus-frontend-$target" 120
compose_app "$target" up -d "backfire-$target"
wait_running "pecus-backfire-$target" 120

echo "[情報] 5. nginx 切り替え..."
conf="$bluegreen_dir/nginx/conf.d/00-active-slot.conf"
cat >"$conf" <<EOF
# ここだけを書き換えてスイッチする（ops/switch-node.sh 推奨）
# blue / green
geo \$coati_active_slot {
  default $target;
}
EOF
compose_infra exec -T nginx nginx -t
compose_infra exec -T nginx nginx -s reload

echo "[情報] 6. 旧スロット ($current) を停止..."
compose_app "$current" down 2>/dev/null || true

echo ""
echo "[OK] リカバリ完了"
echo "     アクティブスロット: $target"
echo "     スナップショット作成日時: $(jq -r '.created_at' "$meta")"
echo "     Git Commit: $(jq -r '.git_commit' "$meta")"
