#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/../.." && pwd -P)
# shellcheck disable=SC1091
. "$DEPLOY_DIR/lib/common.sh"

version=${1:-}
revision=${2:-}
initialize_db=${3:-false}
data_path=${DATA_PATH:-/var/docker/coati/data}
old_backfire_stopped=false
switched=false
[ -n "$version" ] || die "Release version is required"
[ -n "$revision" ] || die "Git revision is required"

recover_on_error() {
  exit_code=$?
  trap - 0
  if [ "$old_backfire_stopped" = "true" ]; then
    compose_app "$target_slot" stop "backfire-$target_slot" 2>/dev/null || true
    compose_app "$current_slot" up -d --no-build "backfire-$current_slot" 2>/dev/null || true
  fi
  if [ "$switched" = "true" ]; then
    set_active_slot "$current_slot" 2>/dev/null || true
    "$SCRIPT_DIR/update-prometheus-targets.sh" "$current_slot" 2>/dev/null || true
  fi
  [ -z "${active_tmp:-}" ] || rm -f "$active_tmp"
  exit "$exit_code"
}
trap recover_on_error 0

current_slot=$(active_slot)
target_slot=blue
[ "$current_slot" = "blue" ] && target_slot=green
"$SCRIPT_DIR/verify-release.sh" "$version" "$revision" "$target_slot"

echo "[Info] Current slot: $current_slot"
echo "[Info] Target slot: $target_slot"
echo "[Info] Release: $version"

if [ "$initialize_db" = "true" ]; then
  for container in pecus-webapi-blue pecus-frontend-blue pecus-backfire-blue \
    pecus-webapi-green pecus-frontend-green pecus-backfire-green; do
    [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || echo false)" != "true" ] ||
      die "Application containers must be stopped before --initialize-db"
  done
fi

compose_infra up -d --no-build
for container in pecus-postgres pecus-redis pecus-redis-frontend pecus-lexicalconverter; do
  wait_health "$container" 120
done

compose_app "$target_slot" down 2>/dev/null || true

if [ "$initialize_db" = "true" ]; then
  DB_RESET_MODE=true compose_migrate run --rm dbmanager
else
  compose_migrate run --rm dbmanager
fi

compose_app "$target_slot" up -d --no-build "pecusapi-$target_slot" "frontend-$target_slot"
wait_health "pecus-webapi-$target_slot" 300
wait_running "pecus-frontend-$target_slot" 120
"$SCRIPT_DIR/smoke-test-slot.sh" "$target_slot"

# Only one Hangfire BackFire instance may be active.
compose_app "$current_slot" stop "backfire-$current_slot" 2>/dev/null || true
old_backfire_running=$(docker inspect -f '{{.State.Running}}' "pecus-backfire-$current_slot" 2>/dev/null || echo false)
[ "$old_backfire_running" != "true" ] ||
  die "Failed to stop old BackFire on $current_slot; refusing to start a second worker"
old_backfire_stopped=true
compose_app "$target_slot" up -d --no-build "backfire-$target_slot"
wait_running "pecus-backfire-$target_slot" 120

switched=true
set_active_slot "$target_slot"
"$SCRIPT_DIR/update-prometheus-targets.sh" "$target_slot"

"$SCRIPT_DIR/smoke-test-slot.sh" "$target_slot"
"$SCRIPT_DIR/smoke-test-public.sh" "$target_slot"
mkdir -p "$data_path/releases"
active_tmp=$(mktemp "$data_path/releases/.active.XXXXXX")
cat >"$active_tmp" <<EOF
{
  "version": "$version",
  "revision": "$revision",
  "slot": "$target_slot"
}
EOF
mv "$active_tmp" "$data_path/releases/active.json"
trap - 0
echo "[OK] Switched to $target_slot; old WebApi/Frontend remain available for rollback."
