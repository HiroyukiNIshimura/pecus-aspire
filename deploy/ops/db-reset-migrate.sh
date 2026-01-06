#!/bin/sh
set -eu

# Reset DB and Run Migration
# WARNING: This deletes all data in the database!

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

confirm_yes "This will DROP database and LOST ALL DATA"

echo "[Info] Stopping apps..."
sh ./app-down.sh -y

echo "[Info] Running DbManager (Drop & Create)..."
# Ensure infra is up (db needs to be running)
sh ./infra-up.sh

compose_migrate run --rm --build dbmanager

echo "[OK] DB Reset & Migrate finished."