#!/bin/sh
set -eu

# Restore images from snapshot tag
# Usage: ./snapshot-restore.sh [snapshot_suffix]
# If suffix is omitted, "latest" is used.

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

suffix="${1:-latest}"
echo "Restoring from snapshot: $suffix"

# We need to restore to both blue and green? Or just current active?
# The switch-node.sh builds image from source.
# This restore script is only for emergency image rollback without rebuild.

# Restore to local tags
# coati-webapi:snapshot-XXX -> coati-webapi-blue:local AND coati-webapi-green:local

services="coati-webapi coati-frontend coati-backfire"

for svc in $services; do
  snapshot_img="$svc:snapshot-$suffix"
  
  if ! docker image inspect "$snapshot_img" >/dev/null 2>&1; then
    echo "[Error] Snapshot image not found: $snapshot_img" >&2
    exit 1
  fi

  echo "Restoring $svc..."
  docker tag "$snapshot_img" "${svc}-blue:local"
  docker tag "$snapshot_img" "${svc}-green:local"
done

echo "[OK] Images restored. You can now restart containers."