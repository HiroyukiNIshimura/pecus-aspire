#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
# shellcheck source=./lib.sh
. "$script_dir/lib.sh"

require_cmd docker

# Check if any app containers are running
running_app_containers=$(docker ps --format '{{.Names}}' | grep -E '^pecus-(webapi|frontend|backfire)-(blue|green)$' || true)

if [ -n "$running_app_containers" ]; then
  echo "[Error] App containers are still running. Stop them first:" >&2
  echo "$running_app_containers" >&2
  exit 2
fi

confirm_yes "This will stop ALL infra containers (DB, Redis, etc)"

compose_infra down

echo "[OK] Infra stopped."