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
  *)
    echo "Usage: $0 {setup|list}" >&2
    exit 2
    ;;
esac
