#!/usr/bin/env bash
# ============================================
# Prometheus ターゲットファイル更新スクリプト
#
# 使用方法:
#   ./update-prometheus-targets.sh [slot]
#
# 引数:
#   slot: アクティブスロット (blue|green)
#         省略時は active_slot ファイルから読み取り
#
# 出力:
#   ops/prometheus/targets/*.json
# ============================================

if [ -z "${BASH_VERSION:-}" ]; then
	exec bash "$0" "$@"
fi

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$script_dir/lib.sh"

targets_dir="$script_dir/prometheus/targets"

# ターゲットディレクトリ作成
mkdir -p "$targets_dir"

# アクティブスロット取得
if [ -n "${1:-}" ]; then
  slot="$1"
else
  slot="$(active_slot)"
fi

echo "[INFO] Prometheus ターゲット更新: アクティブスロット=$slot"

# ============================================
# Backend ターゲット（アクティブスロットのみ）
# ============================================
cat > "$targets_dir/backend.json" <<EOF
[
  {
    "targets": ["pecusapi-${slot}:7265"],
    "labels": {
      "slot": "${slot}",
      "env": "production",
      "service": "backend"
    }
  }
]
EOF
echo "[OK] backend.json 更新"

# ============================================
# Frontend ターゲット（アクティブスロットのみ）
# ============================================
cat > "$targets_dir/frontend.json" <<EOF
[
  {
    "targets": ["frontend-${slot}:3000"],
    "labels": {
      "slot": "${slot}",
      "env": "production",
      "service": "frontend"
    }
  }
]
EOF
echo "[OK] frontend.json 更新"

# ============================================
# インフラターゲット（LexicalConverter）
# ============================================
cat > "$targets_dir/infra.json" <<EOF
[
  {
    "targets": ["lexicalconverter:9101"],
    "labels": {
      "env": "production",
      "service": "lexicalconverter"
    }
  }
]
EOF
echo "[OK] infra.json 更新"

# ============================================
# Node Exporter ターゲット
# ============================================
cat > "$targets_dir/node.json" <<EOF
[
  {
    "targets": ["node-exporter:9100"],
    "labels": {
      "env": "production",
      "service": "node-exporter"
    }
  }
]
EOF
echo "[OK] node.json 更新"

# ============================================
# Blackbox（外形監視）ターゲット
# ============================================
cat > "$targets_dir/blackbox.json" <<EOF
[
  {
    "targets": [
      "http://pecusapi-${slot}:7265/health",
      "http://frontend-${slot}:3000/health"
    ],
    "labels": {
      "slot": "${slot}",
      "env": "production"
    }
  }
]
EOF
echo "[OK] blackbox.json 更新"

echo "[INFO] 全ターゲットファイルを更新しました"

# Prometheus リロード（起動中の場合）
if docker ps --format '{{.Names}}' | grep -q '^pecus-prometheus$'; then
  echo "[INFO] Prometheus 設定リロード..."
  if curl -s -X POST "http://localhost:9090/-/reload" > /dev/null 2>&1; then
    echo "[OK] Prometheus リロード完了"
  else
    echo "[WARN] Prometheus リロード失敗（コンテナ外からはアクセスできない場合があります）"
  fi
fi
