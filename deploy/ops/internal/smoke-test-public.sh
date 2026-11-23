#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/../.." && pwd -P)
# shellcheck source=deploy/lib/common.sh
. "$DEPLOY_DIR/lib/common.sh"

expected_slot=${1:-}
case "$expected_slot" in blue|green) ;; *) die "Usage: $0 {blue|green}" ;; esac

public_code=$(docker exec pecus-nginx wget -q -S -O /dev/null http://localhost/ 2>&1 |
  awk 'index($1, "HTTP/") == 1 {code=$2} END {print code}')
case "$public_code" in
  200|301|302|307|308) ;;
  *) die "Public Nginx route failed for $expected_slot: $public_code" ;;
esac

configured_slot=$(docker exec pecus-nginx awk \
  '/default[[:space:]]+(blue|green);/{gsub(";", "", $2); slot=$2} END {print slot}' \
  /etc/nginx/conf.d/00-active-slot.conf)
[ "$configured_slot" = "$expected_slot" ] ||
  die "Nginx active slot is $configured_slot, expected $expected_slot"

echo "[OK] Public route and Nginx slot verified: $expected_slot"
