#!/usr/bin/env bash
set -euo pipefail

# Conservative cleanup helper.
# - Removes stopped containers (global)
# - Optionally removes dangling images and build cache

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

prune_images=false
prune_builder=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prune-images)
      prune_images=true
      shift
      ;;
    --prune-builder)
      prune_builder=true
      shift
      ;;
    -h|--help)
      echo "usage: $0 [--prune-images] [--prune-builder]" >&2
      exit 0
      ;;
    *)
      echo "unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

confirm_phrase "CLEANUP"

echo "[info] removing stopped containers (global)" >&2
docker container prune -f

if $prune_images; then
  echo "[info] removing dangling images (global)" >&2
  docker image prune -f
fi

if $prune_builder; then
  echo "[info] pruning build cache (global)" >&2
  docker builder prune -f
fi

echo "[ok] cleanup finished"