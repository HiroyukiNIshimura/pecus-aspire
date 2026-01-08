#!/bin/sh
set -eu

# ================================================================================
# レジストリ内の古いイメージクリーンアップスクリプト
# ================================================================================
# 用途: 指定日数以前のイメージタグを削除し、ストレージを最適化
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
DAYS="${1:-${CLEANUP_DAYS:-7}}"

echo "========================================="
echo "  レジストリイメージクリーンアップ"
echo "========================================="
echo ""
echo "レジストリ: $REGISTRY"
echo "保持期間: ${DAYS}日"
echo ""

# 日付計算（Mac/Linux 両対応）
if date --version >/dev/null 2>&1; then
    # GNU date (Linux)
    CUTOFF_DATE=$(date -d "${DAYS} days ago" +%Y%m%d)
else
    # BSD date (macOS)
    CUTOFF_DATE=$(date -v-${DAYS}d +%Y%m%d)
fi

echo "削除対象: ${CUTOFF_DATE} 以前（当日含む）のタグ"
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

    for TAG in $TAGS; do
        # latest タグはスキップ
        if [ "$TAG" = "latest" ]; then
            echo "   ⏩ Skipped: $TAG (保護タグ)"
            KEPT_COUNT=$((KEPT_COUNT + 1))
            continue
        fi

        # タグが日付形式（YYYYMMDDHHMMSS）かチェック
        if echo "$TAG" | grep -Eq '^[0-9]{14}$'; then
            TAG_DATE=$(echo "$TAG" | cut -c1-8)

            if [ "$TAG_DATE" -le "$CUTOFF_DATE" ]; then
                echo "   🗑️  Deleting: $TAG ($TAG_DATE <= $CUTOFF_DATE)"

                # マニフェストダイジェストを取得
                DIGEST=$(curl -s -I -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
                    "http://$REGISTRY/v2/$REPO/manifests/$TAG" | \
                    grep -i "Docker-Content-Digest" | awk '{print $2}' | tr -d '\r')

                if [ -n "$DIGEST" ]; then
                    # マニフェストを削除
                    curl -s -X DELETE "http://$REGISTRY/v2/$REPO/manifests/$DIGEST" > /dev/null
                    echo "      ✅ Deleted"
                    DELETED_COUNT=$((DELETED_COUNT + 1))
                else
                    echo "      ⚠️  ダイジェスト取得失敗"
                fi
            else
                echo "   ✅ Kept: $TAG ($TAG_DATE >= $CUTOFF_DATE)"
                KEPT_COUNT=$((KEPT_COUNT + 1))
            fi
        else
            echo "   ⏩ Skipped: $TAG (日付形式でない)"
            KEPT_COUNT=$((KEPT_COUNT + 1))
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
    echo ""
fi

echo "✅ クリーンアップ完了"
echo ""
