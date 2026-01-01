#!/usr/bin/env bash
set -euo pipefail

# カーソル復元（異常終了時対策）
trap 'tput cnorm 2>/dev/null || true' EXIT

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bluegreen_dir="$(cd "$script_dir/.." && pwd)"
repo_root="$(cd "$bluegreen_dir/.." && pwd)"

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "[エラー] 必要なコマンドが見つかりません: $cmd" >&2
    exit 127
  }
}

ensure_env_file() {
  local env_path="$bluegreen_dir/.env"
  if [[ -f "$env_path" ]]; then
    return 0
  fi

  echo "[警告] $env_path が見つかりません。scripts/generate-appsettings.js (-P) で生成します" >&2

  require_cmd node
  node "$repo_root/scripts/generate-appsettings.js" -P

  if [[ ! -f "$env_path" ]]; then
    echo "[エラー] $env_path の生成に失敗しました" >&2
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
  # app compose は depends_on を削除済みなので単体で実行可能
  compose -f "$bluegreen_dir/docker-compose.app-$slot.yml" "$@"
}

check_infra_healthy() {
  local services=("pecus-postgres" "pecus-redis" "pecus-redis-frontend" "pecus-lexicalconverter")
  local all_healthy=true
  for svc in "${services[@]}"; do
    local running
    running=$(docker inspect -f '{{.State.Running}}' "$svc" 2>/dev/null || echo "")
    if [[ "$running" != "true" ]]; then
      echo "[エラー] インフラが起動していません: $svc" >&2
      all_healthy=false
      continue
    fi
    local status
    status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$svc" 2>/dev/null || echo "")
    if [[ "$status" != "healthy" && "$status" != "none" ]]; then
      echo "[エラー] インフラが正常ではありません: $svc (status=$status)" >&2
      all_healthy=false
    fi
  done
  if [[ "$all_healthy" == "false" ]]; then
    return 1
  fi
  echo "[OK] 全インフラサービス正常"
  return 0
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
    echo "[エラー] アクティブスロット設定が見つかりません: $conf" >&2
    exit 1
  fi

  local slot
  slot=$(awk '/default[[:space:]]+(blue|green);/{print $2}' "$conf" | tr -d ';' | tail -n 1)
  if [[ "$slot" != "blue" && "$slot" != "green" ]]; then
    echo "[エラー] アクティブスロットの検出に失敗: $conf" >&2
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
        echo "[OK] 正常: $container_name"
        return 0
        ;;
      unhealthy)
        echo "[エラー] 異常: $container_name" >&2
        docker inspect "$container_name" --format '{{json .State.Health}}' 2>/dev/null || true
        return 1
        ;;
      none)
        echo "[エラー] ヘルスチェック未定義: $container_name" >&2
        return 2
        ;;
      "")
        echo "[エラー] コンテナが見つかりません: $container_name" >&2
        return 3
        ;;
    esac

    local now
    now=$(date +%s)
    if (( now - start > timeout_sec )); then
      echo "[エラー] タイムアウト (ヘルスチェック待機): $container_name" >&2
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
      echo "[OK] 起動中: $container_name"
      return 0
    fi

    local now
    now=$(date +%s)
    if (( now - start > timeout_sec )); then
      echo "[エラー] タイムアウト (起動待機): $container_name" >&2
      return 1
    fi

    sleep 1
  done
}

confirm_yes() {
  local message="${1:-破壊的な操作です}"
  echo "[警告] $message 続行しますか? (yes/no) [no]: " >&2
  local input
  read -r input
  if [[ "$input" != "yes" ]]; then
    echo "[中止] キャンセルしました" >&2
    exit 3
  fi
}
