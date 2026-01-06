#!/usr/bin/env bash
set -euo pipefail

slot="${1:-}"
if [[ "$slot" != "blue" && "$slot" != "green" ]]; then
  echo "usage: $0 {blue|green}" >&2
  exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root_dir="$(cd "$script_dir/.." && pwd)"
conf="$root_dir/nginx/conf.d/00-active-slot.conf"

cat >"$conf" <<EOF
# ここだけを書き換えてスイッチする（scripts/switch-slot.sh 推奨）
# blue / green
geo \$coati_active_slot {
  default $slot;
}
EOF

echo "[ok] active slot set to: $slot"

docker compose -f "$root_dir/docker-compose.infra.yml" exec -T nginx nginx -t
docker compose -f "$root_dir/docker-compose.infra.yml" exec -T nginx nginx -s reload

echo "[ok] nginx reloaded"
