#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/.." && pwd -P)
# shellcheck disable=SC1091
. "$DEPLOY_DIR/lib/common.sh"

version=${1:-}
[ -n "$version" ] || die "Usage: $0 <previous-release-version>"
case "$version" in *[!A-Za-z0-9._-]*) die "Invalid release version: $version" ;; esac
confirm_yes "Switch traffic to the inactive slot running release $version"
"$DEPLOY_DIR/ops/coati" _rollback "$version"
