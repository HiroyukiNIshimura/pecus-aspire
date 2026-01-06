#!/bin/sh
set -eu

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

# Infra only: postgres/redis/redis-frontend/lexicalconverter/nginx

echo "[Info] Starting Infra..."
compose_infra up -d --build

wait_health pecus-postgres 300
wait_health pecus-redis 300
wait_health pecus-redis-frontend 300
wait_health pecus-lexicalconverter 300
wait_running pecus-nginx 60

echo "[OK] Infra started."

echo "[Info] Updating Prometheus targets..."
sh "$script_dir/update-prometheus-targets.sh"
