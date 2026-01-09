#!/bin/sh
set -eu

# ================================================================================
# イメージビルド & プッシュスクリプト
# ================================================================================
# 用途: Pecus の全サービスまたは指定サービスをビルドし、レジストリにプッシュ
# 実行タイミング: ソースコード更新後、デプロイ前
# ================================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

# 環境変数の読み込み
if [ -f "$SCRIPT_DIR/.env" ]; then
    . "$SCRIPT_DIR/.env"
else
    echo "⚠️  .env ファイルが見つかりません。.env.example からコピーしてください。"
    echo "   cp .env.example .env"
    exit 1
fi

REGISTRY="${REGISTRY_HOST:-localhost}:${REGISTRY_PORT:-5000}"
VERSION=$(date +%Y%m%d%H%M%S)

# 全サービスの定義（空白区切り）
ALL_SERVICES="pecus-webapi pecus-frontend pecus-backfire pecus-dbmanager lexicalconverter"

# 引数で指定されたサービス、なければ全サービス
if [ $# -eq 0 ]; then
    SERVICES="$ALL_SERVICES"
else
    SERVICES="$*"
fi

echo "========================================="
echo "  Pecus イメージビルド & プッシュ"
echo "========================================="
echo ""
echo "レジストリ: $REGISTRY"
echo "バージョン: $VERSION"
echo "対象サービス: $SERVICES"
echo ""

# Step 0: Git pull で最新ソースコードを取得
echo "📥 最新ソースコードを取得中..."
if [ -d "$PROJECT_ROOT/.git" ]; then
    if git -C "$PROJECT_ROOT" pull; then
        echo "✅ Git pull 完了"
    else
        echo "⚠️  Git pull に失敗しました。続行します..."
    fi
else
    echo "⚠️  .git ディレクトリが見つかりません。Git pull をスキップします。"
fi
echo ""

# Step 1: appsettings.json を生成（.gitignore で除外されているため）
echo "⚙️  appsettings.json を生成中..."
if [ -f "$PROJECT_ROOT/scripts/generate-appsettings.js" ]; then
    if node "$PROJECT_ROOT/scripts/generate-appsettings.js" -P; then
        echo "✅ appsettings.json 生成完了（本番設定）"
    else
        echo "❌ appsettings.json の生成に失敗しました"
        exit 1
    fi
else
    echo "❌ generate-appsettings.js が見つかりません"
    exit 1
fi
echo ""

# ビルド結果の記録
SUCCESS_SERVICES=""
FAILED_SERVICES=""
SUCCESS_COUNT=0
FAILED_COUNT=0

for SERVICE in $SERVICES; do
    echo "----------------------------------------"
    echo "📦 Building: $SERVICE"
    echo "----------------------------------------"

    # サービス名から Dockerfile 名へのマッピング
    case "$SERVICE" in
        pecus-webapi)
            DOCKERFILE_NAME="WebApi.Dockerfile"
            ;;
        pecus-frontend)
            DOCKERFILE_NAME="Frontend.Dockerfile"
            ;;
        pecus-backfire)
            DOCKERFILE_NAME="BackFire.Dockerfile"
            ;;
        pecus-dbmanager)
            DOCKERFILE_NAME="DbManager.Dockerfile"
            ;;
        lexicalconverter)
            DOCKERFILE_NAME="LexicalConverter.Dockerfile"
            ;;
        *)
            echo "⚠️  Unknown service: $SERVICE"
            FAILED_SERVICES="$FAILED_SERVICES $SERVICE"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            continue
            ;;
    esac

    DOCKERFILE="$PROJECT_ROOT/deploy/dockerfiles/$DOCKERFILE_NAME"

    if [ ! -f "$DOCKERFILE" ]; then
        echo "⚠️  Dockerfile not found: $DOCKERFILE"
        FAILED_SERVICES="$FAILED_SERVICES $SERVICE"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        continue
    fi

    # イメージのビルド
    if docker build \
        -t "$REGISTRY/$SERVICE:$VERSION" \
        -t "$REGISTRY/$SERVICE:latest" \
        -f "$DOCKERFILE" \
        "$PROJECT_ROOT"; then

        echo "✅ Build succeeded: $SERVICE"

        # バージョンタグでプッシュ
        echo "🚀 Pushing: $REGISTRY/$SERVICE:$VERSION"
        if docker push "$REGISTRY/$SERVICE:$VERSION"; then
            echo "✅ Pushed: $VERSION"
        else
            echo "❌ Push failed: $VERSION"
            FAILED_SERVICES="$FAILED_SERVICES $SERVICE"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            continue
        fi

        # latest タグでプッシュ
        echo "🚀 Pushing: $REGISTRY/$SERVICE:latest"
        if docker push "$REGISTRY/$SERVICE:latest"; then
            echo "✅ Pushed: latest"
            SUCCESS_SERVICES="$SUCCESS_SERVICES $SERVICE"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "❌ Push failed: latest"
            FAILED_SERVICES="$FAILED_SERVICES $SERVICE"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    else
        echo "❌ Build failed: $SERVICE"
        FAILED_SERVICES="$FAILED_SERVICES $SERVICE"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi

    echo ""
done

echo "========================================="
echo "  ビルド結果サマリー"
echo "========================================="
echo ""
echo "バージョン: $VERSION"
echo ""

if [ $SUCCESS_COUNT -gt 0 ]; then
    echo "✅ 成功 (${SUCCESS_COUNT}件):"
    for SERVICE in $SUCCESS_SERVICES; do
        echo "   - $SERVICE"
    done
    echo ""
fi

if [ $FAILED_COUNT -gt 0 ]; then
    echo "❌ 失敗 (${FAILED_COUNT}件):"
    for SERVICE in $FAILED_SERVICES; do
        echo "   - $SERVICE"
    done
    echo ""
    exit 1
fi

echo "🎉 全サービスのビルド & プッシュが完了しました。"
echo ""
echo "次のステップ:"
echo "  - デプロイPC側でイメージをプル: cd ../deploy-pc && ./pull-and-deploy.sh"
echo "  - レジストリ確認: curl http://$REGISTRY/v2/_catalog"
echo ""
