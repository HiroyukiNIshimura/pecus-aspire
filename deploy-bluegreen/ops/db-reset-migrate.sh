#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# DB destructive reset + migrate (DB_RESET_MODE=true)

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

# Ensure infra is up (at least postgres and lexicalconverter)
wait_health pecus-postgres 10 >/dev/null || {
  echo "[ng] infra seems down. run infra-up.sh first." >&2
  exit 2
}
wait_health pecus-lexicalconverter 10 >/dev/null || {
  echo "[ng] infra seems down. run infra-up.sh first." >&2
  exit 2
}

# Confirmation
# - interactive: ./db-reset-migrate.sh
# - non-interactive: ./db-reset-migrate.sh RESET-DB
# - explicit: ./db-reset-migrate.sh --confirm RESET-DB
if [[ "${1:-}" == "RESET-DB" ]]; then
  shift
elif [[ "${1:-}" == "--confirm" && "${2:-}" == "RESET-DB" ]]; then
  shift 2
else
  confirm_phrase "RESET-DB"
fi

# Best-effort cleanup of previous dbmanager container
if docker ps -a --format '{{.Names}}' | grep -qx 'pecus-dbmanager'; then
  docker rm -f pecus-dbmanager >/dev/null 2>&1 || true
fi

compose_migrate run --rm -e DB_RESET_MODE=true dbmanager

echo "[ok] db reset+migrate finished"