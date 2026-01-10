#!/bin/sh
set -eu

# Create docker image snapshot from current running containers (or specified tags)
# This is useful for rollback if we don't have a registry.
# Works with both local build and registry-based images.

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

slot=$(active_slot)
echo "Active slot: $slot"

# Snapshot tag: YYYYMMDD-HHMMSS
tag_suffix=$(date +%Y%m%d-%H%M%S)

# Include dbmanager for migration rollback
services="coati-webapi coati-frontend coati-backfire coati-dbmanager"

for svc in $services; do
  # Try local build tag first
  local_img="${svc}-${slot}:local"

  # For dbmanager, there's no slot suffix
  if [ "$svc" = "coati-dbmanager" ]; then
    local_img="${svc}:local"
  fi

  target_tag="${svc}:snapshot-${tag_suffix}"
  latest_tag="${svc}:snapshot-latest"

  if docker image inspect "$local_img" >/dev/null 2>&1; then
    echo "Tagging $local_img -> $target_tag"
    docker tag "$local_img" "$target_tag"
    docker tag "$local_img" "$latest_tag"
  else
    # Try registry-based image (for registry deployment)
    # Check if any image with this service name exists in running containers
    container_name="pecus-${svc#coati-}-${slot}"
    if [ "$svc" = "coati-dbmanager" ]; then
      container_name="pecus-dbmanager"
    fi
    container_img=$(docker inspect -f '{{.Config.Image}}' "$container_name" 2>/dev/null || true)
    if [ -n "$container_img" ] && docker image inspect "$container_img" >/dev/null 2>&1; then
      echo "Tagging $container_img -> $target_tag"
      docker tag "$container_img" "$target_tag"
      docker tag "$container_img" "$latest_tag"
    else
      echo "[Warn] Image not found for: $svc (tried $local_img)"
    fi
  fi
done

echo "[OK] Snapshot created: $tag_suffix"