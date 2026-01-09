#!/bin/sh
set -eu

# Reset DB and Run Migration
# WARNING: This deletes all data in the database!
# Usage: db-reset-migrate.sh [--build]
#   --build: Build image locally (default: use pre-built image from registry)

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

# Parse arguments
BUILD_FLAG=""
for arg in "$@"; do
  case "$arg" in
    --build)
      BUILD_FLAG="--build"
      ;;
  esac
done

confirm_yes "This will DROP database and LOST ALL DATA"

echo "[Info] Stopping apps..."
sh ./app-down.sh -y

echo "[Info] Running DbManager (Drop & Create)..."
# Ensure infra is up (db needs to be running)
sh ./infra-up.sh --no-build

# Clean up uploads directory
echo "[Info] Cleaning up uploads directory..."
if [ -d "$DATA_PATH/uploads" ]; then
  rm -rf "${DATA_PATH:?}/uploads/"*
  echo "[OK] Uploads directory cleaned."
else
  echo "[Warn] Uploads directory not found: $DATA_PATH/uploads"
fi

# shellcheck disable=SC2086
DB_RESET_MODE=true compose_migrate run --rm $BUILD_FLAG dbmanager

echo "[OK] DB Reset & Migrate finished."