#!/bin/sh
set -eu

# Reset DB and Run Migration
# WARNING: This deletes all data in the database!

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

confirm_yes "This will DROP database and LOST ALL DATA"

echo "[Info] Stopping apps..."
sh ./app-down.sh -y

echo "[Info] Running DbManager (Drop & Create)..."
# Ensure infra is up (db needs to be running)
sh ./infra-up.sh --no-build

DB_RESET_MODE=true compose_migrate run --rm --build dbmanager

echo "[OK] DB Reset & Migrate finished."