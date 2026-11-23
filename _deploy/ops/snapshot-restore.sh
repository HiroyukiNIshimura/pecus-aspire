#!/bin/sh
set -eu

# Restore images from snapshot tag
# Usage: ./snapshot-restore.sh [snapshot_suffix]
# If suffix is omitted, "latest" is used.

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

suffix="${1:-latest}"
echo "Restoring from snapshot: $suffix"

# Include dbmanager for migration rollback
services="coati-webapi coati-frontend coati-backfire coati-dbmanager"

for svc in $services; do
  snapshot_img="$svc:snapshot-$suffix"

  if ! docker image inspect "$snapshot_img" >/dev/null 2>&1; then
    echo "[Error] Snapshot image not found: $snapshot_img" >&2
    exit 1
  fi

  echo "Restoring $svc..."

  if [ "$svc" = "coati-dbmanager" ]; then
    # dbmanager has no slot suffix
    docker tag "$snapshot_img" "${svc}:local"
  else
    # Restore to both slots
    docker tag "$snapshot_img" "${svc}-blue:local"
    docker tag "$snapshot_img" "${svc}-green:local"
  fi
done

echo "[OK] Images restored. You can now restart containers with --no-build."