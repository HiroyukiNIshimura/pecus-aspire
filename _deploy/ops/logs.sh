#!/bin/sh
set -eu

# Usage:
#   logs.sh [active|blue|green] [docker compose logs options...]
# Examples:
#   logs.sh active -f --tail=200
#   logs.sh blue --since=10m

slot_arg="${1:-active}"
# shift is safe in POSIX even if $# is 1, but some old shells might complain if $# is 0?
# In this case $1 is at least "active" (default), so $# >= 0.
# If argument is provided, shift it.
if [ "$#" -gt 0 ]; then
  shift
fi

# shellcheck disable=SC1007
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck disable=SC1091
. "$script_dir/lib.sh"

require_cmd docker

slot="$slot_arg"
if [ "$slot" = "active" ]; then
  slot="$(active_slot)"
fi

if [ "$slot" != "blue" ] && [ "$slot" != "green" ]; then
  echo "Usage: $0 [active|blue|green] [logs options...]" >&2
  exit 2
fi

compose_app "$slot" logs "$@"