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

    removed=0
    : >"$work_dir/remove"
    for service in $SERVICES; do
      while IFS= read -r tag; do
        [ -n "$tag" ] || continue
        if grep -Fxq "$tag" "$work_dir/keep"; then
          echo "[Keep] $service:$tag"
          continue
        fi
        printf '%s\t%s\n' "$service" "$tag" >>"$work_dir/remove"
      done <"$work_dir/$service.tags"
    done

    if [ ! -s "$work_dir/remove" ]; then
      echo "[OK] No registry tags required deletion."
      exit 0
    fi

    registry_data_dir=$(docker inspect pecus-registry \
      --format '{{range .Mounts}}{{if eq .Destination "/var/lib/registry"}}{{.Source}}{{end}}{{end}}')
    [ -n "$registry_data_dir" ] ||
      die "Failed to resolve the /var/lib/registry host mount"

    echo "[GC] Stopping registry for garbage collection..."
    docker stop pecus-registry
    registry_stopped=true

    while IFS="$(printf '\t')" read -r service tag; do
      [ -n "$service" ] && [ -n "$tag" ] || continue
      case "$service" in *[!A-Za-z0-9._-]*) die "Invalid service path in registry tag: $service" ;; esac
      case "$tag" in *[!A-Za-z0-9._-]*) die "Invalid tag path in registry tag: $tag" ;; esac
      tag_dir="$registry_data_dir/docker/registry/v2/repositories/$service/_manifests/tags/$tag"
      if [ -d "$tag_dir" ]; then
        rm -rf -- "$tag_dir"
        removed=$((removed + 1))
        echo "[Remove] $service:$tag"
      else
        echo "[Skip] Tag index already absent: $service:$tag"
      fi
    done <"$work_dir/remove"

    docker run --rm \
      --volume "$registry_data_dir:/var/lib/registry" \
      registry:2 garbage-collect /etc/docker/registry/config.yml
    docker start pecus-registry
    registry_stopped=false
    echo "[OK] Removed $removed tag indexes and completed garbage collection."
    ;;
  *)
    echo "Usage: $0 {setup|list|prune [keep-count]}" >&2
    exit 2
    ;;
esac
