#!/bin/sh
set -eu

# Start monitoring stack (Prometheus etc)

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

echo "[Info] Updating Prometheus targets..."
"$script_dir/update-prometheus-targets.sh"

echo "[Info] Starting Monitoring stack..."
compose_monitoring up -d