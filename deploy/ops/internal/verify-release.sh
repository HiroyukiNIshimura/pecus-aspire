#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/../.." && pwd -P)
# shellcheck disable=SC1091
. "$DEPLOY_DIR/lib/common.sh"

version=${1:-}
revision=${2:-}
slot=${3:-}
[ -n "$version" ] || die "Release version is required"
[ -n "$revision" ] || die "Git revision is required"
case "$slot" in blue|green) ;; *) die "Target slot is required" ;; esac

for service in pecus-webapi pecus-frontend pecus-backfire; do
  image=$(local_image_for_service "$service" "$slot")
  [ "$(image_label "$image" org.opencontainers.image.version)" = "$version" ] ||
    die "$image is not release $version"
  [ "$(image_label "$image" org.opencontainers.image.revision)" = "$revision" ] ||
    die "$image does not match revision $revision"
done

for service in pecus-dbmanager lexicalconverter; do
  image=$(local_image_for_service "$service" blue)
  [ "$(image_label "$image" org.opencontainers.image.version)" = "$version" ] ||
    die "$image is not release $version"
  [ "$(image_label "$image" org.opencontainers.image.revision)" = "$revision" ] ||
    die "$image does not match revision $revision"
done

echo "[OK] All images belong to release $version at $revision"
