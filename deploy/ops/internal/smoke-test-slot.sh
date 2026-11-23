#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/../.." && pwd -P)
# shellcheck source=deploy/lib/common.sh
. "$DEPLOY_DIR/lib/common.sh"

slot=${1:-}
case "$slot" in blue|green) ;; *) die "Usage: $0 {blue|green}" ;; esac

api_code=$(docker exec pecus-nginx wget -q -S -O /dev/null "http://pecusapi-$slot:7265/health" 2>&1 |
  awk '/HTTP\\// {code=$2} END {print code}')
[ "$api_code" = "200" ] || die "API health failed for $slot: $api_code"

front_code=$(docker exec pecus-nginx wget -q -S -O /dev/null "http://frontend-$slot:3000/" 2>&1 |
  awk '/HTTP\\// {code=$2} END {print code}')
case "$front_code" in
  200|301|302|307|308) ;;
  *) die "Frontend check failed for $slot: $front_code" ;;
esac

echo "[OK] Smoke test passed for $slot"
