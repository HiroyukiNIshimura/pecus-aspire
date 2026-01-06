#!/bin/sh
set -eu

# Cleanup unused resources
# - Stopped containers (pecus-*)
# - Unused images (coati-*) excluding snapshot-latest
# - Dangling images
# - Builder cache

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

echo "[Warn] This will remove:"
echo "  - Stopped 'pecus-*' containers"
echo "  - Unused 'coati-*' images (EXCEPT :snapshot-latest)"
echo "  - Dangling images"
echo "  - Builder cache"
echo ""

confirm_yes "Proceed with cleanup?"

echo "[Info] Removing stopped pecus containers..."
# shellcheck disable=SC2046
for container in $(docker ps -a --format '{{.Names}}' 2>/dev/null | grep -E '^pecus-'); do
  running=$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || echo "false")
  if [ "$running" != "true" ]; then
    docker rm -f "$container" 2>/dev/null || true
    echo "Deleted container: $container"
  fi
done

echo "[Info] Removing unused coati images (preserving snapshot-latest)..."
# Cleanup unused images (excluding snapshot-latest)
for img in $(docker images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | grep -E '^coati-'); do
  case "$img" in
    *":snapshot-latest")
      echo "Skipping protected image: $img"
      continue
      ;;
  esac
  
  # Check if image is used by any container (even stopped ones not caught above)
  img_id=$(docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep "^$img " | awk '{print $2}')
  if [ -n "$img_id" ]; then
    # Check if any container (running or stopped) uses this image ID
    if ! docker ps -a -q --filter "ancestor=$img_id" 2>/dev/null | grep -q .; then
      if docker rmi "$img" 2>/dev/null; then
        echo "Deleted image: $img"
      fi
    else
      echo "Skipping in-use image: $img"
    fi
  fi
done

echo "[Info] Pruning dangling images..."
docker images -f "dangling=true" -q 2>/dev/null | xargs -r docker rmi 2>/dev/null || true

echo "[Info] Pruning builder cache..."
docker builder prune -f 2>/dev/null || true

echo "[OK] Cleanup completed."