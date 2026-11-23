#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/../.." && pwd -P)
# shellcheck source=deploy/lib/common.sh
. "$DEPLOY_DIR/lib/common.sh"

slot=${1:-}
case "$slot" in blue|green) ;; *) die "Usage: $0 {blue|green}" ;; esac

api_out=$(docker exec pecus-nginx wget -q -S -O /dev/null "http://pecusapi-$slot:7265/health" 2>&1 || true)
api_code=$(printf '%s\n' "$api_out" |
  awk 'index($1, "HTTP/") == 1 {code=$2} END {print code}')
[ "$api_code" = "200" ] || {
  printf '%s\n' "$api_out" >&2
  die "API health failed for $slot: ${api_code:-no HTTP response}"
}

front_out=$(docker exec pecus-nginx wget -q -S -O /dev/null "http://frontend-$slot:3000/" 2>&1 || true)
front_code=$(printf '%s\n' "$front_out" |
  awk 'index($1, "HTTP/") == 1 {code=$2} END {print code}')
case "$front_code" in
  200|301|302|307|308) ;;
  *)
    printf '%s\n' "$front_out" >&2
    die "Frontend check failed for $slot: ${front_code:-no HTTP response}"
    ;;
esac

echo "[OK] Smoke test passed for $slot"
