#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH="" cd -- "$(dirname "$0")" && pwd -P)
DEPLOY_DIR=$(CDPATH="" cd -- "$SCRIPT_DIR/.." && pwd -P)
# shellcheck disable=SC1091
. "$DEPLOY_DIR/lib/common.sh"

require_cmd docker
require_cmd curl
require_cmd jq
load_env "$SCRIPT_DIR/.env"
REGISTRY=${REGISTRY_HOST:-localhost}:${REGISTRY_PORT:-5000}

case "${1:-}" in
  setup)
    docker compose \
      -f "$DEPLOY_DIR/docker-compose.registry.yml" \
      --env-file "$SCRIPT_DIR/.env" \
      up -d
    curl -fsS "http://$REGISTRY/v2/_catalog" | jq .
    ;;
  list)
    curl -fsS "http://$REGISTRY/v2/_catalog" | jq -r '.repositories[]?' |
      while IFS= read -r repository; do
        echo "[$repository]"
        curl -fsS "http://$REGISTRY/v2/$repository/tags/list" | jq -r '.tags[]?' | sort -r
      done
    ;;
  prune)
    keep=${2:-${KEEP_RELEASES:-5}}
    case "$keep" in
      *[!0-9]*|'') die "Keep count must be a positive integer" ;;
    esac
    [ "$keep" -gt 0 ] || die "Keep count must be a positive integer"
    confirm_yes "Delete registry tags except latest and the newest $keep complete releases"

    work_dir=$(mktemp -d)
    registry_stopped=false
    cleanup_prune() {
      if [ "$registry_stopped" = "true" ]; then
        docker start pecus-registry >/dev/null 2>&1 || true
      fi
      rm -rf "$work_dir"
    }
    trap cleanup_prune EXIT

    for service in $SERVICES; do
      response=$(curl -fsS "http://$REGISTRY/v2/$service/tags/list")
      printf '%s\n' "$response" | jq -r '.tags[]?' |
        grep -v '^latest$' |
        sort >"$work_dir/$service.tags"
    done

    complete_file="$work_dir/complete"
    cp "$work_dir/pecus-webapi.tags" "$complete_file"
    for service in pecus-frontend pecus-backfire pecus-dbmanager lexicalconverter; do
      comm -12 "$complete_file" "$work_dir/$service.tags" >"$complete_file.next"
      mv "$complete_file.next" "$complete_file"
    done

    # New release names contain a commit suffix, while legacy names are 14-digit timestamps.
    # Keep the newest complete releases as rollback candidates; incomplete tags are never kept.
    sort -r "$complete_file" | head -n "$keep" >"$work_dir/keep"

    deleted=0
    for service in $SERVICES; do
      while IFS= read -r tag; do
        [ -n "$tag" ] || continue
        if grep -Fxq "$tag" "$work_dir/keep"; then
          echo "[Keep] $service:$tag"
          continue
        fi

        header_file="$work_dir/header"
        body_file="$work_dir/body"
        http_code=$(curl -sS -D "$header_file" -o "$body_file" -w '%{http_code}' \
          -H 'Accept: application/vnd.oci.image.manifest.v1+json' \
          -H 'Accept: application/vnd.docker.distribution.manifest.v2+json' \
          "http://$REGISTRY/v2/$service/manifests/$tag")
        if [ "$http_code" != "200" ]; then
          echo "[Warn] Cannot read manifest: $service:$tag (HTTP $http_code)" >&2
          continue
        fi
        digest=$(awk 'tolower($1) == "docker-content-digest:" {gsub("\r","",$2); print $2; exit}' "$header_file")
        [ -n "$digest" ] || {
          echo "[Warn] Digest missing: $service:$tag" >&2
          continue
        }

        status=$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE \
          "http://$REGISTRY/v2/$service/manifests/$digest")
        if [ "$status" = "202" ]; then
          echo "[Delete] $service:$tag"
          deleted=$((deleted + 1))
        else
          echo "[Warn] Delete failed: $service:$tag (HTTP $status)" >&2
        fi
      done <"$work_dir/$service.tags"
    done

    [ "$deleted" -gt 0 ] || {
      echo "[OK] No registry tags required deletion."
      exit 0
    }

    registry_data_dir=${REGISTRY_DATA_DIR:-./data/registry}
    case "$registry_data_dir" in
      /*) ;;
      *) registry_data_dir="$DEPLOY_DIR/$registry_data_dir" ;;
    esac
    echo "[GC] Stopping registry for garbage collection..."
    docker stop pecus-registry
    registry_stopped=true
    docker run --rm \
      --volume "$registry_data_dir:/var/lib/registry" \
      registry:2 garbage-collect /etc/docker/registry/config.yml
    docker start pecus-registry
    registry_stopped=false
    echo "[OK] Deleted $deleted tags and completed garbage collection."
    ;;
  *)
    echo "Usage: $0 {setup|list|prune [keep-count]}" >&2
    exit 2
    ;;
esac
