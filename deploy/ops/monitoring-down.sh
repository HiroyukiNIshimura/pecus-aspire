#!/bin/sh
set -eu

# Stop monitoring stack

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

echo "=========================================="
echo " Stopping Monitoring Stack"
echo "=========================================="

compose_monitoring down

echo ""
echo "[OK] Monitoring stack stopped."