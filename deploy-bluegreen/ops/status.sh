#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

slot="$(active_slot)"
echo "active_slot=$slot"
echo

echo "--- infra ---"
compose_infra ps

echo

echo "--- app-blue ---"
compose_app blue ps

echo

echo "--- app-green ---"
compose_app green ps
