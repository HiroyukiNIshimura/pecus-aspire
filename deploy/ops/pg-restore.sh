#!/bin/sh
set -eu

# Usage: ./pg-restore.sh [backup_file_name]
# backup_file_name: e.g., pecusdb_20240101T120000Z.dump (inside backup volume)
# If not provided, available backups are listed and prompted for.

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

target_file="${1:-}"

if [ -z "$target_file" ]; then
  echo "Available backups:"
  # shellcheck disable=SC2154
  compose \
    -f "$bluegreen_dir/docker-compose.infra.yml" \
    -f "$bluegreen_dir/docker-compose.restore-helper.yml" \
    run --rm postgres-restore ls -lh /backups

  echo ""
  printf "Enter backup filename to restore: "
  read -r target_file
fi

if [ -z "$target_file" ]; then
  echo "[Error] No backup file specified." >&2
  exit 1
fi

case "$target_file" in
  *.dump) ;;
  *)
    echo "[Error] Backup filename must end with .dump." >&2
    exit 1
    ;;
esac

case "$target_file" in
  *[!A-Za-z0-9_.-]*|*..*)
    echo "[Error] Invalid backup filename: $target_file" >&2
    exit 1
    ;;
esac

backup_path="$DATA_PATH/backups/postgres/$target_file"
if [ ! -f "$backup_path" ] || [ ! -r "$backup_path" ]; then
  echo "[Error] Backup file does not exist or is not readable: $backup_path" >&2
  exit 1
fi

echo "[Info] Checking backup archive..."
compose \
  -f "$bluegreen_dir/docker-compose.infra.yml" \
  -f "$bluegreen_dir/docker-compose.restore-helper.yml" \
  run --rm -e BACKUP_FILE="$target_file" postgres-restore \
  pg_restore --list "/backups/$target_file" >/dev/null

confirm_yes "Drop and recreate the configured database, then restore from $target_file"

echo "[Info] Stopping apps..."
sh "$script_dir/app-down.sh" -y

echo "[Info] Restoring..."
compose \
  -f "$bluegreen_dir/docker-compose.infra.yml" \
  -f "$bluegreen_dir/docker-compose.restore-helper.yml" \
  run --rm -e BACKUP_FILE="$target_file" postgres-restore

echo "[OK] Restore finished."
echo "[Info] App containers remain stopped; restart them after verifying the restored database."