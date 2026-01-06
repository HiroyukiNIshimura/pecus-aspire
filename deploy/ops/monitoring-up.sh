#!/usr/bin/env bash
# ============================================
# 監視基盤（Prometheus, Exporters）の起動スクリプト
#
# 使用方法:
#   ./monitoring-up.sh
#
# 起動するコンテナ:
#   - pecus-prometheus
#   - pecus-node-exporter
#   - pecus-blackbox-exporter
# ============================================

if [ -z "${BASH_VERSION:-}" ]; then
	exec bash "$0" "$@"
fi

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

require_cmd docker

echo "[INFO] Prometheus ターゲットファイルを更新..."
"$script_dir/update-prometheus-targets.sh"

echo "[INFO] 監視基盤を起動..."
compose_monitoring up -d

wait_health pecus-prometheus 120

echo "[OK] 監視基盤起動完了"
echo "  - pecus-prometheus"
echo "  - pecus-node-exporter"
echo "  - pecus-blackbox-exporter"
