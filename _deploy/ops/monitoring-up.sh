#!/bin/sh
set -eu

# Start monitoring stack (Prometheus etc)

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

echo "[Info] Updating Prometheus targets..."
sh "$script_dir/update-prometheus-targets.sh"

echo "[Info] Starting Monitoring stack..."
compose_monitoring up -d