#!/bin/bash
# ==============================================================================
# monitoring-down.sh - 監視スタック(Prometheus)停止スクリプト
# ==============================================================================

if [ -z "${BASH_VERSION:-}" ]; then
	exec bash "$0" "$@"
fi

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib.sh"

echo "=========================================="
echo " Monitoring Stack 停止"
echo "=========================================="

compose_monitoring down

echo ""
echo "✅ Monitoring スタックを停止しました"
