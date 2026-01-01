#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# Usage:
#   logs.sh [active|blue|green] [docker compose logs options...]
# Examples:
#   logs.sh active -f --tail=200
#   logs.sh blue --since=10m

slot_arg="${1:-active}"
shift || true

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

slot="$slot_arg"
if [[ "$slot" == "active" ]]; then
  slot="$(active_slot)"
fi

if [[ "$slot" != "blue" && "$slot" != "green" ]]; then
  echo "使用方法: $0 [active|blue|green] [logs オプション...]" >&2
  exit 2
fi

compose_app "$slot" logs "$@"