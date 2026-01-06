#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# Conservative cleanup helper for pecus project.
# - Removes stopped pecus-* containers
# - Optionally removes unused pecus-* images and dangling images
# - Optionally removes build cache

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

prune_images=false
prune_builder=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prune-images)
      prune_images=true
      shift
      ;;
    --prune-builder)
      prune_builder=true
      shift
      ;;
    -h|--help)
      echo "使用方法: $0 [--prune-images] [--prune-builder]" >&2
      echo "  --prune-images   未使用の pecus-* イメージと dangling イメージを削除" >&2
      echo "  --prune-builder  ビルドキャッシュを削除" >&2
      exit 0
      ;;
    *)
      echo "不明な引数: $1" >&2
      exit 2
      ;;
  esac
done

confirm_yes "コンテナ/イメージのクリーンアップを実行します (pecus-* 対象)。"

echo "[情報] 停止中の pecus-* コンテナを削除" >&2
for container in $(docker ps -a --format '{{.Names}}' 2>/dev/null | grep -E '^pecus-'); do
  running=$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || echo "false")
  if [[ "$running" != "true" ]]; then
    echo "  削除: $container" >&2
    docker rm -f "$container" 2>/dev/null || true
  fi
done

if $prune_images; then
  echo "[情報] 未使用の pecus-* イメージを削除" >&2
  for img in $(docker images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | grep -E '^pecus-'); do
    img_id=$(docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep "^$img " | awk '{print $2}')
    if [[ -n "$img_id" ]] && ! docker ps -q --filter "ancestor=$img_id" 2>/dev/null | grep -q .; then
      echo "  削除: $img" >&2
      docker rmi "$img" 2>/dev/null || true
    fi
  done

  echo "[情報] dangling イメージを削除" >&2
  docker images -f "dangling=true" -q 2>/dev/null | xargs -r docker rmi 2>/dev/null || true
fi

if $prune_builder; then
  echo "[情報] ビルドキャッシュを削除" >&2
  docker builder prune -f 2>/dev/null || true
fi

echo "[OK] クリーンアップ完了"