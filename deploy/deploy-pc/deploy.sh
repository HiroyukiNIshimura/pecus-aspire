#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/.." && pwd -P)
# shellcheck disable=SC1091
. "$DEPLOY_DIR/lib/common.sh"

require_cmd docker
require_cmd ssh
require_cmd jq
require_cmd tar
load_env "$SCRIPT_DIR/.env"
export CONTAINER_UID CONTAINER_GID
acquire_deploy_lock
deploy_succeeded=false
cleanup_deploy() {
  exit_code=$?
  if [ "$deploy_succeeded" != "true" ] && [ -n "${previous_env_tmp:-}" ]; then
    if [ -s "$previous_env_tmp" ]; then
      cp "$previous_env_tmp" "$DEPLOY_DIR/.env"
      chmod 600 "$DEPLOY_DIR/.env"
    else
      rm -f "$DEPLOY_DIR/.env"
    fi
    if [ -s "${previous_images_file:-}" ]; then
      while IFS="$(printf '\t')" read -r image previous_id; do
        [ -n "$image" ] && [ -n "$previous_id" ] || continue
        docker tag "$previous_id" "$image" >/dev/null 2>&1 || true
      done <"$previous_images_file"
    fi
    docker compose \
      --env-file "$DEPLOY_DIR/.env" \
      --project-directory "$DEPLOY_DIR" \
      -f "$DEPLOY_DIR/docker-compose.infra.yml" \
      up -d --no-build lexicalconverter >/dev/null 2>&1 || true
  fi
  release_deploy_lock
  rm -rf "${release_tmp:-}"
  rm -f "${manifest_tmp:-}"
  rm -f "${previous_env_tmp:-}" "${previous_images_file:-}"
  exit "$exit_code"
}
trap cleanup_deploy EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

for redis_dir in "$DATA_PATH/redis" "$DATA_PATH/redis-frontend"; do
  [ -d "$redis_dir" ] ||
    die "Redis data directory is missing: $redis_dir. Run sudo ./setup.sh"
  owner_mismatch=$(find "$redis_dir" -xdev \( ! -uid "$CONTAINER_UID" -o ! -gid "$CONTAINER_GID" \) -print -quit)
  if [ -n "$owner_mismatch" ]; then
    die "Redis data is not owned by ${CONTAINER_UID}:${CONTAINER_GID}: $redis_dir. Run sudo ./setup.sh before deployment"
  fi
  [ -w "$redis_dir" ] ||
    die "Redis data directory is not writable by the current user: $redis_dir"
done

version=${1:-}
initialize_db=false
shift 1 2>/dev/null || true
while [ $# -gt 0 ]; do
  case "$1" in
    --initialize-db) initialize_db=true; shift ;;
    *) die "Unknown option: $1" ;;
  esac
done

[ -n "$version" ] || die "Usage: $0 <immutable-release-version> [--initialize-db]"
[ "$version" != "latest" ] || die "The mutable latest tag cannot be deployed; choose an immutable release"
case "$version" in *[!A-Za-z0-9._-]*) die "Invalid release version: $version" ;; esac

if [ "$initialize_db" = "true" ]; then
  confirm_yes "Delete and recreate the production database for the first environment setup"
fi

BUILD_PC="$BUILD_PC_USER@$BUILD_PC_IP"
REMOTE_ROOT=${BUILD_PC_PROJECT_PATH:-/var/docker/coati/pecus-aspire}
manifest_tmp=$(mktemp)
release_tmp=$(mktemp -d)

# Fetch manifest and protected runtime settings with one SSH authentication.
# Version and remote root are validated and intentionally expanded locally.
# shellcheck disable=SC2029
ssh "$BUILD_PC" \
  "tar cf - -C '$REMOTE_ROOT/deploy/build-pc/releases' '$version.json' '$version.env'" |
  tar xf - -C "$release_tmp"
cp "$release_tmp/$version.json" "$manifest_tmp"
env_tmp="$release_tmp/$version.env"

schema=$(jq -r '.schemaVersion' "$manifest_tmp")
release_version=$(jq -r '.version' "$manifest_tmp")
revision=$(jq -r '.revision' "$manifest_tmp")
[ "$schema" = "1" ] || die "Unsupported release manifest schema: $schema"
[ "$release_version" = "$version" ] || die "Manifest version mismatch"
[ -n "$revision" ] && [ "$revision" != "null" ] || die "Manifest revision is missing"

expected_services=$(
  printf '%s\n' "$SERVICES" | tr ' ' '\n' | sort | tr '\n' ' '
)
actual_services=$(
  jq -r '.images[].service' "$manifest_tmp" | sort | tr '\n' ' '
)
[ "$actual_services" = "$expected_services" ] || die "Manifest does not contain exactly all release services"

chmod 600 "$env_tmp"
for entry in "CONTAINER_UID:$CONTAINER_UID" "CONTAINER_GID:$CONTAINER_GID" "DATA_PATH:$DATA_PATH"; do
  name=${entry%%:*}
  value=${entry#*:}
  if grep -q "^$name=" "$env_tmp"; then
    sed -i "s|^$name=.*|$name=$value|" "$env_tmp"
  else
    printf '%s=%s\n' "$name" "$value" >>"$env_tmp"
  fi
done

registry="${BUILD_PC_IP}:${REGISTRY_PORT:-5000}"
current_slot=$(active_slot)
target_slot=blue
[ "$current_slot" = "blue" ] && target_slot=green

previous_env_tmp=$(mktemp)
previous_images_file=$(mktemp)
if [ -f "$DEPLOY_DIR/.env" ]; then
  cp "$DEPLOY_DIR/.env" "$previous_env_tmp"
else
  : >"$previous_env_tmp"
fi
for image in coati-dbmanager:local coati-lexicalconverter:local \
  "coati-webapi-$target_slot:local" "coati-frontend-$target_slot:local" \
  "coati-backfire-$target_slot:local"; do
  previous_id=$(docker image inspect "$image" --format '{{.Id}}' 2>/dev/null || echo "")
  [ -n "$previous_id" ] && printf '%s\t%s\n' "$image" "$previous_id" >>"$previous_images_file"
done

for service in $SERVICES; do
  expected_digest=$(jq -r --arg service "$service" '.images[] | select(.service == $service) | .digest' "$manifest_tmp")
  [ -n "$expected_digest" ] && [ "$expected_digest" != "null" ] ||
    die "Digest is missing for $service"
  remote_image="$registry/$service:$version"

  echo "[Pull] $remote_image"
  docker pull "$remote_image"

  repo_digests=$(docker image inspect "$remote_image" --format '{{json .RepoDigests}}')
  echo "$repo_digests" | jq -e --arg digest "@$expected_digest" \
    'any(.[]; endswith($digest))' >/dev/null ||
    die "Digest mismatch for $service"
  [ "$(image_label "$remote_image" org.opencontainers.image.version)" = "$version" ] ||
    die "OCI version label mismatch for $service"
  [ "$(image_label "$remote_image" org.opencontainers.image.revision)" = "$revision" ] ||
    die "OCI revision label mismatch for $service"
done

mv "$env_tmp" "$DEPLOY_DIR/.env"
chmod 600 "$DEPLOY_DIR/.env"
mkdir -p "$DEPLOY_DIR/releases"
cp "$manifest_tmp" "$DEPLOY_DIR/releases/$version.json"

for service in $SERVICES; do
  remote_image="$registry/$service:$version"
  case "$service" in
    pecus-dbmanager) docker tag "$remote_image" coati-dbmanager:local ;;
    lexicalconverter) docker tag "$remote_image" coati-lexicalconverter:local ;;
    pecus-webapi) docker tag "$remote_image" "coati-webapi-$target_slot:local" ;;
    pecus-frontend) docker tag "$remote_image" "coati-frontend-$target_slot:local" ;;
    pecus-backfire) docker tag "$remote_image" "coati-backfire-$target_slot:local" ;;
  esac
done

active_slot_after_pulls=$(active_slot)
[ "$active_slot_after_pulls" = "$current_slot" ] ||
  die "Active slot changed during image pull: $current_slot -> $active_slot_after_pulls"

"$DEPLOY_DIR/ops/coati" _release "$version" "$revision" "$initialize_db"
deploy_succeeded=true
trap - EXIT
cleanup_deploy
