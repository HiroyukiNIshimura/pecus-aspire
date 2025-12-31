#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
root_dir=$(CDPATH= cd -- "$script_dir/.." && pwd -P)

# .env は docker compose が自動で読む想定

docker compose \
  -f "$root_dir/docker-compose.infra.yml" \
  -f "$root_dir/docker-compose.backup.yml" \
  run --rm pgbackup
