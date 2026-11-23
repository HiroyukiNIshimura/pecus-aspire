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
# Accept every manifest type a push can produce. registry:2 answers 404
# (MANIFEST_UNKNOWN) when the stored type is not accepted, e.g. an OCI index or
# manifest list from the containerd image store or buildx attestations.
MANIFEST_ACCEPT='application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json'

# Print the digest of <repository>:<reference> and the digests of its child
# manifests (for an index / manifest list), one per line.
manifest_digests() {
  headers=$(mktemp)
  if ! body=$(curl -fsS -D "$headers" -H "Accept: $MANIFEST_ACCEPT" \
    "http://$REGISTRY/v2/$1/manifests/$2"); then
    rm -f "$headers"
    return 1
  fi
  digest=$(awk 'tolower($1) == "docker-content-digest:" {print $2}' "$headers" | tr -d '\r')
  rm -f "$headers"
  [ -n "$digest" ] || return 1
  printf '%s\n' "$digest"
  printf '%s\n' "$body" | jq -r '.manifests[]?.digest'
}

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
  releases)
    manifest_dir="$SCRIPT_DIR/releases"
    [ -d "$manifest_dir" ] || die "No release manifests found: $manifest_dir"
    printf '%-32s %-14s %-25s %s\n' RELEASE REVISION CREATED SUBJECT
    for manifest in "$manifest_dir"/*.json; do
      [ -f "$manifest" ] || continue
      release=$(jq -r '.version' "$manifest")
      revision=$(jq -r '.revision[0:12]' "$manifest")
      subject=$(jq -r '.subject // "(legacy manifest)"' "$manifest")
      created=$(jq -r '.created // "-"' "$manifest")
      expected_count=$(printf '%s\n' "$SERVICES" | tr ' ' '\n' | wc -w | tr -d ' ')
      actual_count=$(jq -r '.images[].service' "$manifest" | sort -u | wc -l | tr -d ' ')
      state="complete"
      [ "$actual_count" = "$expected_count" ] || state="incomplete"
      printf '%-32s %-14s %-25s %s [%s]\n' \
        "$release" "$revision" "$created" "$subject" "$state"
    done | sort -k3,3r
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
      printf '%s\n' "$response" | jq -r '.tags[]?' | sort >"$work_dir/$service.all-tags"
      grep -v '^latest$' "$work_dir/$service.all-tags" >"$work_dir/$service.tags" || true
    done

    complete_file="$work_dir/complete"
    cp "$work_dir/pecus-webapi.tags" "$complete_file"
    for service in pecus-frontend pecus-backfire pecus-dbmanager lexicalconverter; do
      comm -12 "$complete_file" "$work_dir/$service.tags" >"$complete_file.next"
      mv "$complete_file.next" "$complete_file"
    done
    : >"$work_dir/complete-verified"
    while IFS= read -r tag; do
      [ -n "$tag" ] || continue
      complete=true
      for service in $SERVICES; do
        status=$(curl -sS -o /dev/null -w '%{http_code}' \
          -H "Accept: $MANIFEST_ACCEPT" \
          "http://$REGISTRY/v2/$service/manifests/$tag")
        if [ "$status" != "200" ]; then
          complete=false
          break
        fi
      done
      if [ "$complete" = "true" ]; then
        printf '%s\n' "$tag" >>"$work_dir/complete-verified"
      else
        echo "[Incomplete] $tag has missing registry manifests"
      fi
    done <"$complete_file"

    : >"$work_dir/complete-dated"
    while IFS= read -r tag; do
      [ -n "$tag" ] || continue
      if [ -f "$SCRIPT_DIR/releases/$tag.json" ]; then
        created=$(jq -r '.created // empty' "$SCRIPT_DIR/releases/$tag.json")
      else
        created=""
      fi
      if [ -z "$created" ]; then
        case "$tag" in
          [0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9])
            created=$(printf '%s' "$tag" |
              sed 's/^\(....\)\(..\)\(..\)\(..\)\(..\)\(..\)$/\1-\2-\3T\4:\5:\6Z/')
            ;;
          *) created="0000-00-00T00:00:00Z" ;;
        esac
      fi
      printf '%s\t%s\n' "$created" "$tag" >>"$work_dir/complete-dated"
    done <"$work_dir/complete-verified"
    sort -k1,1r "$work_dir/complete-dated" |
      head -n "$keep" |
      cut -f2 >"$work_dir/keep"

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

    # Delete manifests through the API instead of `garbage-collect -m`:
    # --delete-untagged also removes the untagged child manifests of a kept
    # OCI index / manifest list, which breaks pulls of kept releases.
    # A manifest is deleted only if no kept tag (including latest) references
    # it, directly or as an index child, because deleting a digest removes
    # every tag that points to it.
    for service in $SERVICES; do
      : >"$work_dir/$service.keep-digests"
      : >"$work_dir/$service.remove-digests"
      : >"$work_dir/$service.remove-tags"
      while IFS= read -r tag; do
        [ -n "$tag" ] || continue
        if [ "$tag" = "latest" ] || grep -Fxq "$tag" "$work_dir/keep"; then
          manifest_digests "$service" "$tag" >>"$work_dir/$service.keep-digests" ||
            die "Failed to resolve kept manifest $service:$tag; refusing to delete anything"
        elif digests=$(manifest_digests "$service" "$tag"); then
          printf '%s\n' "$digests" >>"$work_dir/$service.remove-digests"
          printf '%s\t%s\n' "$tag" "$(printf '%s\n' "$digests" | head -n 1)" >>"$work_dir/$service.remove-tags"
        else
          echo "[Skip] Manifest already absent: $service:$tag"
        fi
      done <"$work_dir/$service.all-tags"

      sort -u "$work_dir/$service.keep-digests" -o "$work_dir/$service.keep-digests"
      while IFS="$(printf '\t')" read -r tag digest; do
        [ -n "$tag" ] || continue
        if grep -Fxq "$digest" "$work_dir/$service.keep-digests"; then
          echo "[Skip] $service:$tag shares its manifest with a kept tag"
        else
          echo "[Remove] $service:$tag"
          removed=$((removed + 1))
        fi
      done <"$work_dir/$service.remove-tags"
      sort -u "$work_dir/$service.remove-digests" -o "$work_dir/$service.remove-digests"
      comm -23 "$work_dir/$service.remove-digests" "$work_dir/$service.keep-digests" |
        while IFS= read -r digest; do
          [ -n "$digest" ] || continue
          status=$(curl -sS -o /dev/null -w '%{http_code}' -X DELETE \
            "http://$REGISTRY/v2/$service/manifests/$digest")
          case "$status" in
            202|404) ;;
            405) die "Registry rejected manifest deletion; set REGISTRY_STORAGE_DELETE_ENABLED=true" ;;
            *) die "Failed to delete $service@$digest (HTTP $status)" ;;
          esac
        done
    done

    echo "[GC] Stopping registry for garbage collection..."
    docker stop pecus-registry
    registry_stopped=true
    docker run --rm \
      --volumes-from pecus-registry \
      registry:2 garbage-collect /etc/docker/registry/config.yml
    docker start pecus-registry
    registry_stopped=false
    echo "[OK] Removed $removed tags and completed garbage collection."
    ;;
  *)
    echo "Usage: $0 {setup|list|releases|prune [keep-count]}" >&2
    exit 2
    ;;
esac
