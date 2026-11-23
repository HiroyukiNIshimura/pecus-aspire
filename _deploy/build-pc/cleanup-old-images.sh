#!/bin/sh
set -eu

# ================================================================================
# レジストリ内の古いイメージクリーンアップスクリプト
# ================================================================================
# 用途: リポジトリごとに最新N件のタグを保持し、古いタグを削除
# 実行タイミング: 定期的（週次/月次）または手動
# ================================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 環境変数の読み込み
if [ -f "$SCRIPT_DIR/.env" ]; then
    . "$SCRIPT_DIR/.env"
else
    echo "⚠️  .env ファイルが見つかりません。.env.example からコピーしてください。"
    echo "   cp .env.example .env"
    exit 1
fi

REGISTRY="${REGISTRY_HOST:-localhost}:${REGISTRY_PORT:-5000}"
KEEP_LATEST="${1:-${KEEP_LATEST:-5}}"

echo "========================================="
echo "  レジストリイメージクリーンアップ"
echo "========================================="
echo ""
echo "レジストリ: $REGISTRY"
echo "保持件数: 最新${KEEP_LATEST}件/リポジトリ"
echo ""

# レジストリからリポジトリ一覧を取得
REPOSITORIES=$(curl -s "http://$REGISTRY/v2/_catalog" | jq -r '.repositories[]')

if [ -z "$REPOSITORIES" ]; then
    echo "ℹ️  レジストリにイメージが見つかりません。"
    exit 0
fi

DELETED_COUNT=0
KEPT_COUNT=0

for REPO in $REPOSITORIES; do
    echo "📦 Repository: $REPO"

    # タグ一覧を取得
    TAGS=$(curl -s "http://$REGISTRY/v2/$REPO/tags/list" | jq -r '.tags[]?' || echo "")

    if [ -z "$TAGS" ]; then
        echo "   ℹ️  タグが見つかりません。"
        continue
    fi

    # 日付形式タグを降順ソート（新しい順）
    DATE_TAGS=$(echo "$TAGS" | grep -E '^[0-9]{14}$' | sort -r || echo "")

    # 非日付タグ（latest等）は削除対象外のため無視
    # 日付タグを処理: 最新N件を保持、残りを削除
    INDEX=0
    for TAG in $DATE_TAGS; do
        [ -z "$TAG" ] && continue
        INDEX=$((INDEX + 1))

        if [ "$INDEX" -le "$KEEP_LATEST" ]; then
            echo "   🛡️  Kept: $TAG (${INDEX}/${KEEP_LATEST})"
            KEPT_COUNT=$((KEPT_COUNT + 1))
            continue
        fi

        echo "   🗑️  Deleting: $TAG"

        # マニフェストダイジェストを取得（複数形式に対応）
        MANIFEST_RESPONSE=$(curl -s -I \
            -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
            -H "Accept: application/vnd.oci.image.manifest.v1+json" \
            -H "Accept: application/vnd.docker.distribution.manifest.list.v2+json" \
            -H "Accept: application/vnd.oci.image.index.v1+json" \
            "http://$REGISTRY/v2/$REPO/manifests/$TAG" 2>&1)
        HTTP_STATUS=$(echo "$MANIFEST_RESPONSE" | head -1 | awk '{print $2}')
        DIGEST=$(echo "$MANIFEST_RESPONSE" | grep -i "Docker-Content-Digest" | awk '{print $2}' | tr -d '\r\n')

        if [ "$HTTP_STATUS" = "404" ]; then
            echo "      ℹ️  マニフェスト未存在（既に削除済み/孤立タグ）"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        elif [ -n "$DIGEST" ]; then
            DELETE_RESPONSE=$(curl -s -w "%{http_code}" -X DELETE "http://$REGISTRY/v2/$REPO/manifests/$DIGEST")
            HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -c 4)
            if [ "$HTTP_CODE" = "202" ]; then
                echo "      ✅ Deleted"
                DELETED_COUNT=$((DELETED_COUNT + 1))
            else
                echo "      ⚠️  削除失敗 (HTTP $HTTP_CODE)"
            fi
        else
            echo "      ⚠️  ダイジェスト取得失敗 (HTTP $HTTP_STATUS)"
        fi
    done

    echo ""
done

echo "========================================="
echo "  クリーンアップ結果"
echo "========================================="
echo ""
echo "削除: ${DELETED_COUNT}件"
echo "保持: ${KEPT_COUNT}件"
echo ""

if [ $DELETED_COUNT -gt 0 ]; then
    echo "ℹ️  ガベージコレクションを実行してストレージを解放してください:"
    echo "   docker exec pecus-registry bin/registry garbage-collect /etc/docker/registry/config.yml"
    echo "ガベージコレクション実行中はレジストリが一時的に応答しなくなる場合があります。"
    echo ""
fi

echo "✅ クリーンアップ完了"
echo ""
