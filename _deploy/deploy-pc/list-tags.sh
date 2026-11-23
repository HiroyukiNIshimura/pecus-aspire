#!/bin/sh
set -eu

# ================================================================================
# レジストリタグ一覧表示スクリプト
# ================================================================================
# 用途: レジストリ内のイメージとタグ一覧を表示
# 実行タイミング: デプロイ前のバージョン確認時
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

REGISTRY="${BUILD_PC_IP}:${REGISTRY_PORT:-5000}"

echo "========================================="
echo "  レジストリタグ一覧"
echo "========================================="
echo ""
echo "レジストリ: $REGISTRY"
echo ""

# レジストリからリポジトリ一覧を取得
REPOSITORIES=$(curl -s "http://$REGISTRY/v2/_catalog" | jq -r '.repositories[]?' 2>/dev/null || echo "")

if [ -z "$REPOSITORIES" ]; then
    echo "ℹ️  レジストリにイメージが見つかりません。"
    echo ""
    echo "トラブルシューティング:"
    echo "  1. ビルドPCのIPアドレス確認: $BUILD_PC_IP"
    echo "  2. ネットワーク疎通確認: ping $BUILD_PC_IP"
    echo "  3. レジストリ接続確認: curl http://$REGISTRY/v2/_catalog"
    exit 0
fi

# 各リポジトリのタグ一覧を表示
for REPO in $REPOSITORIES; do
    echo "📦 $REPO"

    # タグ一覧を取得
    TAGS=$(curl -s "http://$REGISTRY/v2/$REPO/tags/list" | jq -r '.tags[]?' 2>/dev/null || echo "")

    if [ -z "$TAGS" ]; then
        echo "   ℹ️  タグが見つかりません"
    else
        # タグを日付順（降順）にソート
        SORTED_TAGS=$(echo "$TAGS" | grep -E '^[0-9]{14}$' | sort -r || echo "")
        OTHER_TAGS=$(echo "$TAGS" | grep -vE '^[0-9]{14}$' || echo "")

        # latest などの特殊タグを先に表示
        if [ -n "$OTHER_TAGS" ]; then
            for TAG in $OTHER_TAGS; do
                echo "   🏷️  $TAG"
            done
        fi

        # 日付タグを新しい順に表示
        if [ -n "$SORTED_TAGS" ]; then
            TAG_COUNT=0
            for TAG in $SORTED_TAGS; do
                # 日付をフォーマット表示（YYYY-MM-DD HH:MM:SS）
                FORMATTED_DATE=$(echo "$TAG" | sed -E 's/([0-9]{4})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/\1-\2-\3 \4:\5:\6/')
                echo "   🏷️  $TAG  ($FORMATTED_DATE)"
                TAG_COUNT=$((TAG_COUNT + 1))

                # 最新5件のみ表示（多すぎる場合）
                if [ $TAG_COUNT -ge 5 ]; then
                    REMAINING=$(echo "$SORTED_TAGS" | wc -l | tr -d ' ')
                    REMAINING=$((REMAINING - 5))
                    if [ $REMAINING -gt 0 ]; then
                        echo "   ... 他 $REMAINING 件のタグ"
                    fi
                    break
                fi
            done
        fi
    fi

    echo ""
done

echo "========================================="
echo "  使用例"
echo "========================================="
echo ""
echo "特定バージョンでデプロイ:"
echo "  ./pull-and-deploy.sh <VERSION_TAG>"
echo ""
echo "例:"
echo "  ./pull-and-deploy.sh 20260108214353"
echo "  ./pull-and-deploy.sh latest"
echo ""
