#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/.." && pwd -P)
# shellcheck disable=SC1091
. "$DEPLOY_DIR/lib/common.sh"

require_cmd docker
require_cmd jq
require_cmd ssh
load_env "$SCRIPT_DIR/.env"

for redis_dir in "$DATA_PATH/redis" "$DATA_PATH/redis-frontend"; do
  [ -d "$redis_dir" ] ||
    die "Redis data directory is missing: $redis_dir. Run sudo ./setup.sh"
  owner_mismatch=$(find "$redis_dir" -xdev \( ! -uid "$CONTAINER_UID" -o ! -gid "$CONTAINER_GID" \) -print -quit)
  if [ -n "$owner_mismatch" ]; then
    die "Redis data is not owned by ${CONTAINER_UID}:${CONTAINER_GID}: $redis_dir. Run sudo ./setup.sh before rollback"
  fi
done

version=${1:-}
if [ -z "$version" ]; then
  manifest_dir="$DEPLOY_DIR/releases"
  [ -d "$manifest_dir" ] || die "No release history is available yet"
  printf '%-32s %-14s %-25s %s\n' RELEASE REVISION CREATED SUBJECT
  for manifest in "$manifest_dir"/*.json; do
    [ -f "$manifest" ] || continue
    jq -r '[.version, .revision[0:12], .created, (.subject // "(legacy manifest)")] | @tsv' \
      "$manifest"
  done | sort -k3,3r | awk -F '\t' '{printf "%-32s %-14s %-25s %s\n", $1,$2,$3,$4}'
  echo
  echo "Usage: $0 <previous-release-version>"
  exit 0
fi

case "$version" in *[!A-Za-z0-9._-]*) die "Invalid release version: $version" ;; esac

manifest="$DEPLOY_DIR/releases/$version.json"
if [ ! -f "$manifest" ]; then
  BUILD_PC="$BUILD_PC_USER@$BUILD_PC_IP"
  REMOTE_ROOT=${BUILD_PC_PROJECT_PATH:-/var/docker/coati/pecus-aspire}
  manifest_tmp=$(mktemp)
  trap 'rm -f "$manifest_tmp"' EXIT
  # Validated release path values are intentionally expanded on the client side.
  # shellcheck disable=SC2029
  ssh "$BUILD_PC" "cat '$REMOTE_ROOT/deploy/build-pc/releases/$version.json'" >"$manifest_tmp"
  mkdir -p "$DEPLOY_DIR/releases"
  mv "$manifest_tmp" "$manifest"
  trap - EXIT
fi

schema=$(jq -r '.schemaVersion' "$manifest")
revision=$(jq -r '.revision' "$manifest")
release_version=$(jq -r '.version' "$manifest")
[ "$schema" = "1" ] || die "Unsupported release manifest schema: $schema"
[ "$release_version" = "$version" ] || die "Release manifest mismatch"

expected_services=$(printf '%s\n' "$SERVICES" | tr ' ' '\n' | sort | tr '\n' ' ')
actual_services=$(jq -r '.images[].service' "$manifest" | sort | tr '\n' ' ')
[ "$actual_services" = "$expected_services" ] || die "Release manifest is incomplete"

registry="${BUILD_PC_IP}:${REGISTRY_PORT:-5000}"
current_slot=$(awk '/default[[:space:]]+(blue|green);/{print $2}' \
  "$DEPLOY_DIR/nginx/conf.d/00-active-slot.conf" | tr -d ';' | tail -n 1)
target_slot=blue
[ "$current_slot" = "blue" ] && target_slot=green

for service in $SERVICES; do
  expected_digest=$(jq -r --arg service "$service" \
    '.images[] | select(.service == $service) | .digest' "$manifest")
  remote_image="$registry/$service:$version"
  docker pull "$remote_image"
  repo_digests=$(docker image inspect "$remote_image" --format '{{json .RepoDigests}}')
  echo "$repo_digests" | jq -e --arg digest "@$expected_digest" \
    'any(.[]; endswith($digest))' >/dev/null ||
    die "Digest mismatch for $service"
  [ "$(image_label "$remote_image" org.opencontainers.image.version)" = "$version" ] ||
    die "OCI version label mismatch for $service"
  [ "$(image_label "$remote_image" org.opencontainers.image.revision)" = "$revision" ] ||
    die "OCI revision label mismatch for $service"

  case "$service" in
    pecus-dbmanager) docker tag "$remote_image" coati-dbmanager:local ;;
    lexicalconverter) docker tag "$remote_image" coati-lexicalconverter:local ;;
    pecus-webapi) docker tag "$remote_image" "coati-webapi-$target_slot:local" ;;
    pecus-frontend) docker tag "$remote_image" "coati-frontend-$target_slot:local" ;;
    pecus-backfire) docker tag "$remote_image" "coati-backfire-$target_slot:local" ;;
  esac
done

confirm_yes "Switch traffic to the inactive slot running release $version"
"$DEPLOY_DIR/ops/coati" _rollback "$version"
