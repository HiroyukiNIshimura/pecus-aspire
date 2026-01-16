#!/bin/sh
set -eu

# Usage: infra-up.sh [--build]
#   --build: Build images locally (default: use pre-built images from registry)

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

# Parse options
build_flag="--no-build"
while [ $# -gt 0 ]; do
  case "$1" in
    --build)
      build_flag="--build"
      shift
      ;;
    *)
      echo "[Error] Unknown option: $1" >&2
      echo "Usage: $0 [--build]" >&2
      exit 1
      ;;
  esac
done

# 設定ファイル生成
ensure_env_file
ensure_active_slot_conf

# --no-build の場合、lexicalconverter イメージの存在を確認
if [ "$build_flag" = "--no-build" ]; then
  echo "[Info] Checking for pre-built lexicalconverter image..."
  if ! docker image inspect coati-lexicalconverter:local >/dev/null 2>&1; then
    echo "[Error] Image 'coati-lexicalconverter:local' not found." >&2
    echo "        Options:" >&2
    echo "        1. Run deploy-pc/pull-and-deploy.sh to pull images first" >&2
    echo "        2. Use --build option to build locally: $0 --build" >&2
    exit 1
  fi
  echo "[OK] Image 'coati-lexicalconverter:local' found."
fi

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
