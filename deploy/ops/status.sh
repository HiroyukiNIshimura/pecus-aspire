#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

slot=$(active_slot)
echo "Active slot = $slot"
echo ""

show_container_status() {
  name="$1"
  running=$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null || echo "")
  
  if [ "$running" != "true" ]; then
    status="stopped"
  else
    health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}-{{end}}' "$name" 2>/dev/null || echo "-")
    status="running ($health)"
  fi
  
  # POSIX printf format
  printf "  %-30s %s\n" "$name" "$status"
}

echo "--- infra ---"
show_container_status "pecus-postgres"
show_container_status "pecus-redis"
show_container_status "pecus-redis-frontend"
show_container_status "pecus-lexicalconverter"
show_container_status "pecus-nginx"
echo ""

echo "--- app-blue ---"
show_container_status "pecus-webapi-blue"
show_container_status "pecus-frontend-blue"
show_container_status "pecus-backfire-blue"
echo ""

echo "--- app-green ---"
show_container_status "pecus-webapi-green"
show_container_status "pecus-frontend-green"
show_container_status "pecus-backfire-green"
echo ""

echo "--- monitoring ---"
show_container_status "pecus-prometheus"
show_container_status "pecus-node-exporter"
show_container_status "pecus-blackbox-exporter"
echo ""