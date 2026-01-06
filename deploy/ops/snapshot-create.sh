#!/bin/sh
set -eu

# Create docker image snapshot from current running containers (or specified tags)
# This is useful for rollback if we don't have a registry.

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

slot=$(active_slot)
echo "Active slot: $slot"

# Snapshot tag: YYYYMMDD-HHMMSS
tag_suffix=$(date +%Y%m%d-%H%M%S)

images="coati-webapi-$slot:local coati-frontend-$slot:local coati-backfire-$slot:local"

for img in $images; do
  # e.g. coati-webapi-blue:local -> coati-webapi:snapshot-2024...
  base_name=$(echo "$img" | sed -E 's/-(blue|green):local//')
  
  # Remove slot from base name to make snapshot independent of slot?
  # Actually, if we want to restore to any slot, we should just use generic names.
  # But currently images are tagged with slot suffix.
  
  target_tag="${base_name}:snapshot-${tag_suffix}"
  latest_tag="${base_name}:snapshot-latest"

  echo "Tagging $img -> $target_tag"
  if docker image inspect "$img" >/dev/null 2>&1; then
    docker tag "$img" "$target_tag"
    docker tag "$img" "$latest_tag"
  else
    echo "[Warn] Image not found: $img"
  fi
done

echo "[OK] Snapshot created: $tag_suffix"