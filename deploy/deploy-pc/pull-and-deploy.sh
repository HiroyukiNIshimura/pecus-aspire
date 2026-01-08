#!/bin/sh
set -eu

# ================================================================================
# イメージプル & デプロイスクリプト
# ================================================================================
# 用途: ビルドPCからイメージをプルし、Blue-Greenデプロイを実行
# 実行タイミング: 新バージョンのデプロイ時
# ================================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
OPS_DIR="$DEPLOY_DIR/ops"

# 環境変数の読み込み
if [ -f "$SCRIPT_DIR/.env" ]; then
    . "$SCRIPT_DIR/.env"
else
    echo "⚠️  .env ファイルが見つかりません。.env.example からコピーしてください。"
    echo "   cp .env.example .env"
    exit 1
fi

REGISTRY="${BUILD_PC_IP}:${REGISTRY_PORT:-5000}"
VERSION="${1:-latest}"

# 全サービスの定義（空白区切り）
ALL_SERVICES="pecus-webapi pecus-frontend pecus-backfire pecus-dbmanager lexicalconverter"

echo "========================================="
echo "  Pecus イメージプル & デプロイ"
echo "========================================="
echo ""
echo "レジストリ: $REGISTRY"
echo "バージョン: $VERSION"
echo ""

# Step 1: 現在のアクティブスロット判定
echo "🔍 現在のアクティブスロットを確認中..."
if [ -f "$OPS_DIR/lib.sh" ]; then
    # lib.sh が期待する script_dir 変数を定義
    script_dir="$OPS_DIR"
    . "$OPS_DIR/lib.sh"
    CURRENT_SLOT=$(active_slot || echo "unknown")
else
    echo "⚠️  ops/lib.sh が見つかりません。"
    CURRENT_SLOT="unknown"
fi

echo "   現在のスロット: $CURRENT_SLOT"
echo ""

# デプロイ先スロットの決定
if [ "$CURRENT_SLOT" = "blue" ]; then
    TARGET_SLOT="green"
elif [ "$CURRENT_SLOT" = "green" ]; then
    TARGET_SLOT="blue"
else
    # 初回デプロイまたは不明な場合は blue を使用
    echo "⚠️  アクティブスロットが不明です。blue にデプロイします。"
    TARGET_SLOT="blue"
fi

echo "📦 デプロイ先: $TARGET_SLOT"
echo ""

# Step 2: イメージのプル
echo "🚀 イメージをプルしています..."
PULL_SUCCESS_COUNT=0
PULL_FAILED_COUNT=0
PULL_FAILED_SERVICES=""

for SERVICE in $ALL_SERVICES; do
    IMAGE_TAG="$REGISTRY/$SERVICE:$VERSION"
    echo "   Pulling: $IMAGE_TAG"

    # エラー出力を一時ファイルに保存
    PULL_OUTPUT=$(mktemp)
    if docker pull "$IMAGE_TAG" > "$PULL_OUTPUT" 2>&1; then
        echo "      ✅ Success"
        PULL_SUCCESS_COUNT=$((PULL_SUCCESS_COUNT + 1))
    else
        echo "      ❌ Failed"
        echo "      エラー詳細:"
        head -3 "$PULL_OUTPUT" | sed 's/^/         /'
        PULL_FAILED_SERVICES="$PULL_FAILED_SERVICES $SERVICE"
        PULL_FAILED_COUNT=$((PULL_FAILED_COUNT + 1))
    fi
    rm -f "$PULL_OUTPUT"
done

echo ""
echo "プル結果: 成功 $PULL_SUCCESS_COUNT / 失敗 $PULL_FAILED_COUNT"
echo ""

if [ $PULL_FAILED_COUNT -gt 0 ]; then
    echo "❌ 以下のイメージのプルに失敗しました:"
    for SERVICE in $PULL_FAILED_SERVICES; do
        echo "   - $SERVICE"
    done
    echo ""
    echo "トラブルシューティング:"
    echo "  1. レジストリ接続確認: curl http://$REGISTRY/v2/_catalog"
    echo "  2. イメージ存在確認: curl http://$REGISTRY/v2/<service>/tags/list"
    exit 1
fi

# Step 3: switch-node.sh でデプロイ実行（--no-build オプション使用）
echo "🚀 $TARGET_SLOT スロットへデプロイ中..."
echo ""

if [ ! -f "$OPS_DIR/switch-node.sh" ]; then
    echo "❌ ops/switch-node.sh が見つかりません。"
    exit 1
fi

# --no-build オプションを使用して、ビルドをスキップ
if sh "$OPS_DIR/switch-node.sh" "$TARGET_SLOT" --no-build; then
    echo ""
    echo "✅ デプロイ成功"
else
    echo ""
    echo "❌ デプロイ失敗"
    exit 1
fi

echo ""
echo "========================================="
echo "  デプロイ完了"
echo "========================================="
echo ""
echo "バージョン: $VERSION"
echo "アクティブスロット: $TARGET_SLOT"
echo ""
echo "次のステップ:"
echo "  - ステータス確認: cd $OPS_DIR && ./status.sh"
echo "  - ログ確認: docker logs pecus-webapi-$TARGET_SLOT"
echo ""
