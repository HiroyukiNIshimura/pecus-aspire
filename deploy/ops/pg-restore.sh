#!/bin/sh
set -eu

# Usage: ./pg-restore.sh [backup_file_name]
# backup_file_name: e.g., backup_20240101_120000.sql.gz (inside backup volume)
# If not provided, it will prompt or fail depending on implementation of restore-helper

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

target_file="${1:-}"

if [ -z "$target_file" ]; then
  # List available backups
  echo "Available backups:"
  compose \
    -f "$bluegreen_dir/docker-compose.infra.yml" \
    -f "$bluegreen_dir/docker-compose.restore-helper.yml" \
    run --rm restore-helper ls -lh /backups
  
  echo ""
  printf "Enter backup filename to restore: "
  read -r target_file
fi

if [ -z "$target_file" ]; then
  echo "[Error] No backup file specified." >&2
  exit 1
fi

confirm_yes "Restore from $target_file? (Current DB will be overwritten)"

echo "[Info] Stopping apps..."
./app-down.sh -y

echo "[Info] Restoring..."
# Using Environment variable or Command argument depending on restore-helper implementation.
# Assuming standard postgres restore: gunzip -c file | psql ...
# Here we use a helper container.

compose \
  -f "$bluegreen_dir/docker-compose.infra.yml" \
  -f "$bluegreen_dir/docker-compose.restore-helper.yml" \
  run --rm -e BACKUP_FILE="$target_file" restore-helper

echo "[OK] Restore finished."