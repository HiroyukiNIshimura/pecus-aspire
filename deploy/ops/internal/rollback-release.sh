#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/../.." && pwd -P)
# shellcheck disable=SC1091
. "$DEPLOY_DIR/lib/common.sh"

expected_version=${1:-}
expected_revision=${2:-}
# Validate before switching traffic; a failure after the switch triggers recovery.
data_path=${DATA_PATH:?DATA_PATH must be exported by rollback.sh}
current_slot=$(active_slot)
target_slot=blue
[ "$current_slot" = "blue" ] && target_slot=green
old_backfire_stopped=false
old_backfire_was_running=false
switched=false

recover_on_error() {
  exit_code=$?
  trap - 0
  restore_previous_env || true
  if [ "$old_backfire_stopped" = "true" ]; then
    compose_app "$target_slot" stop "backfire-$target_slot" 2>/dev/null || true
  fi
  if [ "$old_backfire_stopped" = "true" ] && [ "$old_backfire_was_running" = "true" ]; then
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

for service in pecus-webapi pecus-frontend; do
  image=$(local_image_for_service "$service" "$target_slot")
  docker image inspect "$image" >/dev/null 2>&1 || die "Rollback image is unavailable: $image"
  actual=$(image_label "$image" org.opencontainers.image.version)
  if [ -n "$expected_version" ] && [ "$actual" != "$expected_version" ]; then
    die "$image is release $actual, not $expected_version"
  fi
done

compose_infra up -d --no-build lexicalconverter
wait_health pecus-lexicalconverter 120

compose_app "$target_slot" up -d --no-build "pecusapi-$target_slot" "frontend-$target_slot"
wait_health "pecus-webapi-$target_slot" 300
wait_running "pecus-frontend-$target_slot" 120

[ "$(docker inspect -f '{{.State.Running}}' "pecus-backfire-$current_slot" 2>/dev/null || echo false)" != "true" ] ||
  old_backfire_was_running=true
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
if [ -n "$expected_revision" ]; then
  mkdir -p "$data_path/releases"
  active_tmp=$(mktemp "$data_path/releases/.active.XXXXXX")
  printf '{\n  "version": "%s",\n  "revision": "%s",\n  "slot": "%s"\n}\n' \
    "$expected_version" "$expected_revision" "$target_slot" >"$active_tmp"
  mv "$active_tmp" "$data_path/releases/active.json"
fi
trap - 0
echo "[OK] Rolled back traffic to $target_slot"
echo "[Warn] Database migrations are not reversed by image rollback."
