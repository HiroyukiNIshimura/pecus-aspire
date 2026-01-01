#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bluegreen_dir="$(cd "$script_dir/.." && pwd)"
repo_root="$(cd "$bluegreen_dir/.." && pwd)"

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "[ng] required command not found: $cmd" >&2
    exit 127
  }
}

ensure_env_file() {
  local env_path="$bluegreen_dir/.env"
  if [[ -f "$env_path" ]]; then
    return 0
  fi

  echo "[warn] $env_path not found. generating via scripts/generate-appsettings.js (-P)" >&2

  require_cmd node
  node "$repo_root/scripts/generate-appsettings.js" -P

  if [[ ! -f "$env_path" ]]; then
    echo "[ng] failed to generate $env_path" >&2
    exit 1
  fi
}

compose() {
  ensure_env_file
  docker compose --env-file "$bluegreen_dir/.env" --project-directory "$bluegreen_dir" "$@"
}

compose_infra() {
  compose -f "$bluegreen_dir/docker-compose.infra.yml" "$@"
}

compose_app() {
  local slot="$1"
  shift
  local cmd="${1:-}"

  # app compose は infra 側サービス(redis-frontend等)に depends_on しているため、
  # 同一プロジェクトとして infra+app を合成して実行する。
  # ただし up 時は --no-recreate で既存 infra コンテナを再起動しない。
  if [[ "$cmd" == "up" ]]; then
    shift
    compose \
      -f "$bluegreen_dir/docker-compose.infra.yml" \
      -f "$bluegreen_dir/docker-compose.app-$slot.yml" \
      up --no-recreate "$@"
  else
    compose \
      -f "$bluegreen_dir/docker-compose.infra.yml" \
      -f "$bluegreen_dir/docker-compose.app-$slot.yml" \
      "$cmd" "$@"
  fi
}

compose_migrate() {
  compose \
    -f "$bluegreen_dir/docker-compose.infra.yml" \
    -f "$bluegreen_dir/docker-compose.migrate.yml" \
    "$@"
}

active_slot() {
  local conf="$bluegreen_dir/nginx/conf.d/00-active-slot.conf"
  if [[ ! -f "$conf" ]]; then
    echo "[ng] active slot config not found: $conf" >&2
    exit 1
  fi

  local slot
  slot=$(awk '/default[[:space:]]+(blue|green);/{print $2}' "$conf" | tr -d ';' | tail -n 1)
  if [[ "$slot" != "blue" && "$slot" != "green" ]]; then
    echo "[ng] failed to detect active slot from: $conf" >&2
    exit 1
  fi
  echo "$slot"
}

wait_health() {
  local container_name="$1"
  local timeout_sec="${2:-300}"
  local start
  start=$(date +%s)

  while true; do
    local status
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container_name" 2>/dev/null || true)

    case "$status" in
      healthy)
        echo "[ok] healthy: $container_name"
        return 0
        ;;
      unhealthy)
        echo "[ng] unhealthy: $container_name" >&2
        docker inspect "$container_name" --format '{{json .State.Health}}' 2>/dev/null || true
        return 1
        ;;
      none)
        echo "[ng] no healthcheck: $container_name" >&2
        return 2
        ;;
      "")
        echo "[ng] container not found: $container_name" >&2
        return 3
        ;;
    esac

    local now
    now=$(date +%s)
    if (( now - start > timeout_sec )); then
      echo "[ng] timeout waiting for healthy: $container_name" >&2
      return 4
    fi

    sleep 2
  done
}

wait_running() {
  local container_name="$1"
  local timeout_sec="${2:-120}"
  local start
  start=$(date +%s)

  while true; do
    local running
    running=$(docker inspect -f '{{.State.Running}}' "$container_name" 2>/dev/null || true)
    if [[ "$running" == "true" ]]; then
      echo "[ok] running: $container_name"
      return 0
    fi

    local now
    now=$(date +%s)
    if (( now - start > timeout_sec )); then
      echo "[ng] timeout waiting for running: $container_name" >&2
      return 1
    fi

    sleep 1
  done
}

confirm_phrase() {
  local phrase="$1"
  echo "[warn] destructive operation. type exactly: $phrase" >&2
  local input
  read -r input
  if [[ "$input" != "$phrase" ]]; then
    echo "[ng] confirmation failed" >&2
    exit 3
  fi
}
