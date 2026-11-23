#!/bin/sh
set -eu

# ================================================================================
# レジストリコンテナ初期構築スクリプト
# ================================================================================
# 用途: プライベートレジストリコンテナを起動し、動作確認を実行
# 実行タイミング: ビルドPC初回セットアップ時
# ================================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 環境変数の読み込み
if [ -f "$SCRIPT_DIR/.env" ]; then
    . "$SCRIPT_DIR/.env"
else
    echo "⚠️  .env ファイルが見つかりません。.env.example からコピーしてください。"
    echo "   cp .env.example .env"
    exit 1
fi

REGISTRY="${REGISTRY_HOST:-localhost}:${REGISTRY_PORT:-5000}"

echo "========================================="
echo "  Pecus プライベートレジストリ セットアップ"
echo "========================================="
echo ""
echo "レジストリ: $REGISTRY"
echo ""

# Step 1: docker-compose.registry.yml の存在確認
REGISTRY_COMPOSE="$DEPLOY_DIR/docker-compose.registry.yml"
if [ ! -f "$REGISTRY_COMPOSE" ]; then
    echo "❌ $REGISTRY_COMPOSE が見つかりません。"
    exit 1
fi

# Step 2: レジストリコンテナの起動
echo "📦 レジストリコンテナを起動しています..."
docker compose -f "$REGISTRY_COMPOSE" --env-file "$SCRIPT_DIR/.env" up -d

# Step 3: コンテナの起動待機
echo "⏳ レジストリの起動を待機中..."
sleep 5

# Step 4: レジストリの動作確認
echo "🔍 レジストリの動作確認..."
if curl -s "http://$REGISTRY/v2/_catalog" > /dev/null; then
    echo "✅ レジストリが正常に起動しました。"
    echo ""
    echo "カタログ確認: http://$REGISTRY/v2/_catalog"
    curl -s "http://$REGISTRY/v2/_catalog" | jq .
else
    echo "❌ レジストリへの接続に失敗しました。"
    echo ""
    echo "トラブルシューティング:"
    echo "  1. コンテナのログを確認: docker logs pecus-registry"
    echo "  2. ポートが使用中でないか確認: lsof -i :${REGISTRY_PORT:-5000}"
    exit 1
fi

echo ""
echo "========================================="
echo "  セットアップ完了"
echo "========================================="
echo ""
echo "次のステップ:"
echo "  - イメージをビルド: ./build-and-push.sh"
echo "  - レジストリ確認: curl http://$REGISTRY/v2/_catalog"
echo ""
