#!/usr/bin/env bash
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# 稼働中のアクティブスロットのアプリ層のみを停止

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

slot=$(active_slot)
echo "アクティブスロット: $slot"

# 確認
# - 対話式: ./app-down.sh
# - スキップ: ./app-down.sh -y
if [[ "${1:-}" != "-y" ]]; then
  confirm_yes "アクティブスロット($slot)のアプリ層を停止します。"
fi

echo "[$slot] アプリ層を停止中..."
compose_app "$slot" down

echo "[OK] アプリ層($slot)を停止しました"
