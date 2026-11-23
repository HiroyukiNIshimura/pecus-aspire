#!/bin/sh
set -eu

# ================================================================================
# レジストリ ガベージコレクションスクリプト
# ================================================================================
# 用途: 未参照のブロブを削除し、ストレージを解放
# 注意: 実行中はレジストリへのプッシュが一時的に失敗する可能性があります
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

REGISTRY_CONTAINER="${REGISTRY_CONTAINER:-pecus-registry}"
REGISTRY_DATA_DIR="${REGISTRY_DATA_DIR:-$DEPLOY_DIR/data/registry}"
DELETE_ORPHAN_TAGS="${1:-false}"

echo "========================================="
echo "  レジストリ ガベージコレクション"
echo "========================================="
echo ""
echo "コンテナ: $REGISTRY_CONTAINER"
echo "データディレクトリ: $REGISTRY_DATA_DIR"
echo "孤立タグ削除: $DELETE_ORPHAN_TAGS"
echo ""

# コンテナが起動しているか確認
if ! docker ps --format '{{.Names}}' | grep -q "^${REGISTRY_CONTAINER}$"; then
    echo "❌ レジストリコンテナが起動していません: $REGISTRY_CONTAINER"
    exit 1
fi

# 孤立タグの削除（オプション）
if [ "$DELETE_ORPHAN_TAGS" = "true" ] || [ "$DELETE_ORPHAN_TAGS" = "--delete-orphan-tags" ]; then
    echo "🔍 孤立タグを検索中..."
    echo ""

    REGISTRY="${REGISTRY_HOST:-localhost}:${REGISTRY_PORT:-5000}"
    REPOSITORIES=$(curl -s "http://$REGISTRY/v2/_catalog" | jq -r '.repositories[]' 2>/dev/null || echo "")

    if [ -n "$REPOSITORIES" ]; then
        ORPHAN_COUNT=0

        for REPO in $REPOSITORIES; do
            TAGS=$(curl -s "http://$REGISTRY/v2/$REPO/tags/list" | jq -r '.tags[]?' 2>/dev/null || echo "")

            for TAG in $TAGS; do
                # マニフェストが存在するか確認
                HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
                    -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
                    -H "Accept: application/vnd.oci.image.manifest.v1+json" \
                    "http://$REGISTRY/v2/$REPO/manifests/$TAG")

                if [ "$HTTP_STATUS" = "404" ]; then
                    TAG_PATH="$REGISTRY_DATA_DIR/docker/registry/v2/repositories/$REPO/_manifests/tags/$TAG"
                    if [ -d "$TAG_PATH" ]; then
                        echo "   🗑️  孤立タグ削除: $REPO:$TAG"
                        rm -rf "$TAG_PATH"
                        ORPHAN_COUNT=$((ORPHAN_COUNT + 1))
                    fi
                fi
            done
        done

        echo ""
        echo "削除した孤立タグ: ${ORPHAN_COUNT}件"
        echo ""
    fi
fi

# ガベージコレクション実行前のストレージサイズ
echo "📊 ガベージコレクション前のストレージサイズ:"
BEFORE_SIZE=$(du -sh "$REGISTRY_DATA_DIR" 2>/dev/null | cut -f1 || echo "不明")
echo "   $BEFORE_SIZE"
echo ""

# ガベージコレクション実行
echo "🧹 ガベージコレクション実行中..."
echo "   （プッシュ操作は一時的に失敗する可能性があります）"
echo ""

docker exec "$REGISTRY_CONTAINER" bin/registry garbage-collect /etc/docker/registry/config.yml

echo ""

# ガベージコレクション実行後のストレージサイズ
echo "📊 ガベージコレクション後のストレージサイズ:"
AFTER_SIZE=$(du -sh "$REGISTRY_DATA_DIR" 2>/dev/null | cut -f1 || echo "不明")
echo "   $AFTER_SIZE"
echo ""

echo "========================================="
echo "  完了"
echo "========================================="
echo ""
echo "ストレージ: $BEFORE_SIZE → $AFTER_SIZE"
echo ""
echo "✅ ガベージコレクション完了"
echo ""
