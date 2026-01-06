#!/bin/sh
set -eu

# Stop monitoring stack

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

echo "=========================================="
echo " Stopping Monitoring Stack"
echo "=========================================="

compose_monitoring down

echo ""
echo "[OK] Monitoring stack stopped."