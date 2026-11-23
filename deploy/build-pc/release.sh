#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/.." && pwd -P)
# shellcheck disable=SC1091
. "$DEPLOY_DIR/lib/common.sh"

require_cmd docker
require_cmd git
require_cmd jq
load_env "$SCRIPT_DIR/.env"

REGISTRY=${REGISTRY_HOST:-localhost}:${REGISTRY_PORT:-5000}
VERSION_ARG=${1:-}
CREATED=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MANIFEST_DIR="$SCRIPT_DIR/releases"
tmp_manifest=$(mktemp)
trap 'rm -f "$tmp_manifest"' EXIT

[ -z "$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no)" ] ||
  die "Tracked working tree is not clean; commit changes before creating a release"

echo "[Info] Updating source..."
git -C "$REPO_ROOT" pull --ff-only

# Re-read the revision after pull and reject a branch update before release generation.
GIT_REVISION=$(git -C "$REPO_ROOT" rev-parse HEAD)
GIT_SHORT=$(git -C "$REPO_ROOT" rev-parse --short=12 HEAD)
VERSION=${VERSION_ARG:-"$(date -u +%Y%m%d%H%M%S)-$GIT_SHORT"}
case "$VERSION" in
  latest|*[!A-Za-z0-9._-]*) die "Invalid immutable release version: $VERSION" ;;
esac
MANIFEST="$MANIFEST_DIR/$VERSION.json"
[ ! -f "$MANIFEST" ] || die "Release already exists: $VERSION"

ensure_env_file

NEXT_PUBLIC_API_URL=$(
  awk -F= '$1 == "NEXT_PUBLIC_API_URL" { sub(/^[^=]*=/, ""); print; exit }' "$DEPLOY_DIR/.env"
)
[ -n "$NEXT_PUBLIC_API_URL" ] || die "NEXT_PUBLIC_API_URL is missing from deploy/.env"

echo '{"schemaVersion":1,"images":[]}' |
  jq --arg version "$VERSION" --arg revision "$GIT_REVISION" --arg created "$CREATED" \
    '. + {version:$version, revision:$revision, created:$created}' >"$tmp_manifest"

for service in $SERVICES; do
  dockerfile=$(dockerfile_for_service "$service")
  image="$REGISTRY/$service:$VERSION"
  echo "[Build] $image"

  build_args=""
  if [ "$service" = "pecus-frontend" ]; then
    build_args="--build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL"
  fi

  # shellcheck disable=SC2086
  docker build \
    --label "org.opencontainers.image.revision=$GIT_REVISION" \
    --label "org.opencontainers.image.version=$VERSION" \
    --label "org.opencontainers.image.created=$CREATED" \
    --label "coati.release=$VERSION" \
    $build_args \
    -t "$image" \
    -f "$DEPLOY_DIR/dockerfiles/$dockerfile" \
    "$REPO_ROOT"

  docker push "$image"

  digest=$(docker image inspect "$image" --format '{{json .RepoDigests}}' |
    jq -er --arg repository "$REGISTRY/$service" \
      '.[] | select(startswith($repository + "@")) | split("@")[-1]')
  [ -n "$digest" ] || die "Failed to resolve digest for $image"

  jq --arg service "$service" --arg repository "$REGISTRY/$service" \
    --arg tag "$VERSION" --arg digest "$digest" \
    '.images += [{service:$service, repository:$repository, tag:$tag, digest:$digest}]' \
    "$tmp_manifest" >"$tmp_manifest.next"
  mv "$tmp_manifest.next" "$tmp_manifest"
done

mkdir -p "$MANIFEST_DIR"
install -m 600 "$DEPLOY_DIR/.env" "$MANIFEST_DIR/$VERSION.env"
mv "$tmp_manifest" "$MANIFEST"
trap - EXIT

# latest is updated only after every immutable release image succeeded.
for service in $SERVICES; do
  docker tag "$REGISTRY/$service:$VERSION" "$REGISTRY/$service:latest"
  docker push "$REGISTRY/$service:latest"
done

echo "[OK] Release created: $VERSION"
echo "[OK] Manifest: $MANIFEST"
echo "[OK] Revision: $GIT_REVISION"
