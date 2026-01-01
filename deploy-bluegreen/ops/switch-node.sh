#!/usr/bin/env bash
set -euo pipefail

# Blue/Green switch procedure
#  3.1 指定ノードをデプロイ（Backfire除く）
#  3.2 稼働中ノードのダウン（Backfire含む）
#  3.3 DBマイグレーション
#  3.4 指定ノード Backfire デプロイ
#  3.5 Nginx 切り替え

slot="${1:-}"
if [[ "$slot" != "blue" && "$slot" != "green" ]]; then
  echo "usage: $0 {blue|green}" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

current="$(active_slot)"
if [[ "$current" == "$slot" ]]; then
  echo "[ng] target slot is already active: $slot" >&2
  exit 2
fi

other="$current"
target="$slot"

echo "[info] current(active)=$current target=$target" >&2

echo "[info] 3.1 deploying target (without backfire): $target" >&2
compose_app "$target" up -d "pecusapi-$target" "frontend-$target"
wait_health "pecus-webapi-$target" 300
wait_running "pecus-frontend-$target" 120

echo "[info] 3.2 stopping other (including backfire): $other" >&2
compose_app "$other" down

echo "[info] 3.3 running db migration" >&2
# Best-effort cleanup of previous dbmanager container
if docker ps -a --format '{{.Names}}' | grep -qx 'pecus-dbmanager'; then
  docker rm -f pecus-dbmanager >/dev/null 2>&1 || true
fi
compose_migrate run --rm dbmanager

echo "[info] 3.4 deploying target backfire: $target" >&2
compose_app "$target" up -d "backfire-$target"
wait_running "pecus-backfire-$target" 120

echo "[info] 3.5 switching nginx to: $target" >&2
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

echo "[ok] switched active slot to: $target"