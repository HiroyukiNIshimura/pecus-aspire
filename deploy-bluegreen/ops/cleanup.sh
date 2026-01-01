#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# Conservative cleanup helper.
# - Removes stopped containers (global)
# - Optionally removes dangling images and build cache

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
      exit 0
      ;;
    *)
      echo "不明な引数: $1" >&2
      exit 2
      ;;
  esac
done

confirm_phrase "CLEANUP"

echo "[情報] 停止中のコンテナを削除 (グローバル)" >&2
docker container prune -f

if $prune_images; then
  echo "[情報] 不要なイメージを削除 (グローバル)" >&2
  docker image prune -f
fi

if $prune_builder; then
  echo "[情報] ビルドキャッシュを削除 (グローバル)" >&2
  docker builder prune -f
fi

echo "[OK] クリーンアップ完了"