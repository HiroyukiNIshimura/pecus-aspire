#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
	exec bash "$0" "$@"
fi

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

slot="$(active_slot)"
echo "アクティブスロット=$slot"
echo

show_container_status() {
  local name="$1"
  local running health
  running=$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null || echo "")
  if [[ "$running" != "true" ]]; then
    printf "  %-30s %s\n" "$name" "stopped"
    return
  fi
  health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}-{{end}}' "$name" 2>/dev/null || echo "-")
  printf "  %-30s running (%s)\n" "$name" "$health"
}

echo "--- infra ---"
show_container_status "pecus-postgres"
show_container_status "pecus-redis"
show_container_status "pecus-redis-frontend"
show_container_status "pecus-lexicalconverter"
show_container_status "pecus-nginx"

echo
echo "--- monitoring ---"
show_container_status "pecus-prometheus"
show_container_status "pecus-node-exporter"
show_container_status "pecus-blackbox-exporter"

echo
echo "--- app-blue ---"
show_container_status "pecus-webapi-blue"
show_container_status "pecus-frontend-blue"
show_container_status "pecus-backfire-blue"

echo
echo "--- app-green ---"
show_container_status "pecus-webapi-green"
show_container_status "pecus-frontend-green"
show_container_status "pecus-backfire-green"
