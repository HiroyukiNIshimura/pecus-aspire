#!/bin/sh
set -eu

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

# Parse options
build_flag="--build"
while [ $# -gt 0 ]; do
  case "$1" in
    --no-build|-n)
      build_flag=""
      shift
      ;;
    *)
      echo "[Error] Unknown option: $1" >&2
      echo "Usage: $0 [--no-build|-n]" >&2
      exit 1
      ;;
  esac
done

# 設定ファイル生成
ensure_env_file

# Infra only: postgres/redis/redis-frontend/lexicalconverter/nginx

echo "[Info] Starting Infra..."
# shellcheck disable=SC2086
compose_infra up -d $build_flag

wait_health pecus-postgres 300
wait_health pecus-redis 300
wait_health pecus-redis-frontend 300
wait_health pecus-lexicalconverter 300
wait_running pecus-nginx 60

echo "[OK] Infra started."

echo "[Info] Updating Prometheus targets..."
sh "$script_dir/update-prometheus-targets.sh"
