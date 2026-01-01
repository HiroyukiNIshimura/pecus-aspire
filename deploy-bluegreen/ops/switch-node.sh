#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# Blue/Green switch procedure
#  3.1 指定ノードをデプロイ（Backfire除く）
#  3.2 稼働中ノードのダウン（Backfire含む）
#  3.3 DBマイグレーション
#  3.4 指定ノード Backfire デプロイ
#  3.5 Nginx 切り替え

# Notes:
# - 判定は「コンテナが動いているか（Running）」で行います。
# - nginx は常に指定した slot を見るように切り替えます。

slot="${1:-}"
if [[ "$slot" != "blue" && "$slot" != "green" ]]; then
  echo "使用方法: $0 {blue|green}" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

current="$(active_slot)"

slot_any_running() {
  local s="$1"

  local api
  api=$(docker inspect -f '{{.State.Running}}' "pecus-webapi-$s" 2>/dev/null || true)
  local fe
  fe=$(docker inspect -f '{{.State.Running}}' "pecus-frontend-$s" 2>/dev/null || true)
  local bf
  bf=$(docker inspect -f '{{.State.Running}}' "pecus-backfire-$s" 2>/dev/null || true)

  [[ "$api" == "true" || "$fe" == "true" || "$bf" == "true" ]]
}

target="$slot"
other="green"
if [[ "$target" == "green" ]]; then
  other="blue"
fi

target_running=false
other_running=false
any_running=false

if slot_any_running "$target"; then
  target_running=true
  any_running=true
fi
if slot_any_running "$other"; then
  other_running=true
  any_running=true
fi

if $target_running; then
  echo "[エラー] ターゲットスロットのコンテナが既に稼働中です: $target" >&2
  echo "        先に停止してください (docker compose -f docker-compose.app-$target.yml down)" >&2
  exit 2
fi

echo "[情報] デプロイ前にインフラの状態を確認中..." >&2
if ! check_infra_healthy; then
  echo "[エラー] インフラサービスが正常ではありません。先に infra-up.sh を実行してください。" >&2
  exit 3
fi

echo "[情報] 現在(アクティブ)=$current ターゲット=$target" >&2

echo "[情報] 3.1 ターゲットをデプロイ (BackFire除く): $target" >&2
compose_app "$target" up -d "pecusapi-$target" "frontend-$target"
wait_health "pecus-webapi-$target" 300
wait_running "pecus-frontend-$target" 120

if $other_running; then
  echo "[情報] 3.2 旧スロットを停止 (BackFire含む): $other" >&2
  compose_app "$other" stop "pecusapi-$other" "frontend-$other" "backfire-$other" || true
  compose_app "$other" rm -f "pecusapi-$other" "frontend-$other" "backfire-$other" || true
else
  echo "[情報] 3.2 旧スロット停止をスキップ (稼働していない): $other" >&2
fi

echo "[情報] 3.3 DBマイグレーション実行" >&2
# Best-effort cleanup of previous dbmanager container
if docker ps -a --format '{{.Names}}' | grep -qx 'pecus-dbmanager'; then
  docker rm -f pecus-dbmanager >/dev/null 2>&1 || true
fi
compose_migrate run --rm dbmanager

echo "[情報] 3.4 ターゲットのBackFireをデプロイ: $target" >&2
compose_app "$target" up -d "backfire-$target"
wait_running "pecus-backfire-$target" 120

echo "[情報] 3.5 Nginxを切り替え: $target" >&2
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

echo "[OK] アクティブスロットを切り替えました: $target"