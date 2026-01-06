#!/bin/sh
set -eu

# Stop active slot app containers only

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

slot=$(active_slot)
echo "Active slot: $slot"

# Usage: ./app-down.sh [-y] (skip confirm)
arg1="${1:-}"  # POSIX sh: parameter expansion

if [ "$arg1" != "-y" ]; then
  confirm_yes "Stop app containers for slot ($slot)"
fi

echo "[$slot] Stopping app containers..."
compose_app "$slot" down

echo "[OK] App containers ($slot) stopped."