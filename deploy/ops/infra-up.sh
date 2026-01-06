#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
	exec bash "$0" "$@"
fi

set -euo pipefail

# Infra only: postgres/redis/redis-frontend/lexicalconverter/nginx
# Monitoring: prometheus/node-exporter/blackbox-exporter

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

# インフラ起動
compose_infra up -d --build

wait_health pecus-postgres 300
wait_health pecus-redis 300
wait_health pecus-redis-frontend 300
wait_health pecus-lexicalconverter 300
wait_running pecus-nginx 60

echo "[OK] インフラ起動完了"

# 監視基盤起動
echo "[INFO] 監視基盤を起動..."
"$script_dir/update-prometheus-targets.sh"
compose_monitoring up -d

wait_health pecus-prometheus 120
echo "[OK] 監視基盤起動完了"