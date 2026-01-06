#!/bin/sh
set -eu

# Cleanup unused images/containers
# WARNING: This removes *all* stopped containers and unused images (dangling).

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

confirm_yes "This will prune ALL stopped containers and dangling images on the host."

echo "[Info] Pruning containers..."
docker container prune -f

echo "[Info] Pruning images..."
docker image prune -f

echo "[Info] Pruning builder cache..."
docker builder prune -f

echo "[OK] Cleanup finished."