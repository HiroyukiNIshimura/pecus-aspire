#!/bin/sh
set -eu

# カーソル復元（異常終了時対策）
# trap 0 は POSIX で EXIT シグナルを意味する
trap 'tput cnorm 2>/dev/null || true' 0

export DATA_PATH="/var/docker/coati/data"

# script_dir は呼び出し元で定義されていること
if [ -z "${script_dir:-}" ]; then
  echo "[Error] script_dir is not defined." >&2
  exit 1
fi

bluegreen_dir=$(CDPATH= cd -- "$script_dir/.." && pwd -P)
repo_root=$(CDPATH= cd -- "$bluegreen_dir/.." && pwd -P)

require_cmd() {
  cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "[Error] Required command not found: $cmd" >&2
    exit 127
  }
}

ensure_env_file() {
  env_path="$bluegreen_dir/.env"
  if [ -f "$env_path" ]; then
    return 0
  fi

  echo "[Warn] $env_path not found. Generating with scripts/generate-appsettings.js (-P)..." >&2

  require_cmd node
  node "$repo_root/scripts/generate-appsettings.js" -P

  if [ ! -f "$env_path" ]; then
    echo "[Error] Failed to generate $env_path" >&2
    exit 1
  fi
}

compose() {
  ensure_env_file
  # orphan 警告を抑制（infra/app を別 compose で管理しているため）
  COMPOSE_IGNORE_ORPHANS=1 docker compose --env-file "$bluegreen_dir/.env" --project-directory "$bluegreen_dir" "$@"
}

compose_infra() {
  compose -f "$bluegreen_dir/docker-compose.infra.yml" "$@"
}

compose_app() {
  slot="$1"
  shift
  # app compose は depends_on を削除済みなので単体で実行可能
  compose -f "$bluegreen_dir/docker-compose.app-$slot.yml" "$@"
}

compose_monitoring() {
  compose -f "$bluegreen_dir/docker-compose.monitoring.yml" "$@"
}

check_infra_healthy() {
  # Space separated list instead of array
  services="pecus-postgres pecus-redis pecus-redis-frontend pecus-lexicalconverter"
  all_healthy=true
  
  for svc in $services; do
    running=$(docker inspect -f '{{.State.Running}}' "$svc" 2>/dev/null || echo "")
    if [ "$running" != "true" ]; then
      echo "[Error] Infra not running: $svc" >&2
      all_healthy=false
      continue
    fi
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$svc" 2>/dev/null || echo "")
    if [ "$status" != "healthy" ] && [ "$status" != "none" ]; then
      echo "[Error] Infra unhealthy: $svc (status=$status)" >&2
      all_healthy=false
    fi
  done

  if [ "$all_healthy" = "false" ]; then
    return 1
  fi
  echo "[OK] All infra services are healthy and running."
  return 0
}

compose_migrate() {
  compose \
    -f "$bluegreen_dir/docker-compose.infra.yml" \
    -f "$bluegreen_dir/docker-compose.migrate.yml" \
    "$@"
}

active_slot() {
  conf="$bluegreen_dir/nginx/conf.d/00-active-slot.conf"
  if [ ! -f "$conf" ]; then
    echo "[Error] Active slot config not found: $conf" >&2
    exit 1
  fi

  # Extract slot: look for 'default blue;' or 'default green;'
  slot=$(awk '/default[[:space:]]+(blue|green);/{print $2}' "$conf" | tr -d ';' | tail -n 1)
  if [ "$slot" != "blue" ] && [ "$slot" != "green" ]; then
    echo "[Error] Failed to detect active slot from: $conf" >&2
    exit 1
  fi
  echo "$slot"
}

wait_health() {
  container_name="$1"
  timeout_sec="${2:-300}"
  start=$(date +%s)

  while true; do
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_name" 2>/dev/null || true)

    case "$status" in
      healthy)
        echo "[OK] Healthy: $container_name"
        return 0
        ;;
      unhealthy)
        echo "[Error] Unhealthy: $container_name" >&2
        docker inspect "$container_name" --format '{{json .State.Health}}' 2>/dev/null || true
        return 1
        ;;
      none)
        echo "[Error] No healthcheck defined: $container_name" >&2
        return 2
        ;;
      "")
        echo "[Error] Container not found: $container_name" >&2
        return 3
        ;;
    esac

    now=$(date +%s)
    elapsed=$((now - start))
    if [ "$elapsed" -gt "$timeout_sec" ]; then
      echo "[Error] Timeout waiting for health: $container_name" >&2
      return 4
    fi

    sleep 2
  done
}

wait_running() {
  container_name="$1"
  timeout_sec="${2:-120}"
  start=$(date +%s)

  while true; do
    running=$(docker inspect -f '{{.State.Running}}' "$container_name" 2>/dev/null || true)
    if [ "$running" = "true" ]; then
      echo "[OK] Running: $container_name"
      return 0
    fi

    now=$(date +%s)
    elapsed=$((now - start))
    if [ "$elapsed" -gt "$timeout_sec" ]; then
      echo "[Error] Timeout waiting for running: $container_name" >&2
      return 1
    fi

    sleep 1
  done
}

confirm_yes() {
  message="${1:-Destructive operation}"
  # printf is safer than echo -n for prompts
  printf "[Warn] %s. Continue? (yes/no) [no]: " "$message" >&2
  read -r input
  if [ "$input" != "yes" ]; then
    echo "[Abort] Cancelled." >&2
    exit 3
  fi
}