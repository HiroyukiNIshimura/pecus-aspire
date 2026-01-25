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
REPO_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"
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
BUILD_PC_USER="${BUILD_PC_USER:-coati}"
BUILD_PC_PROJECT_PATH="${BUILD_PC_PROJECT_PATH:-/var/docker/coati/pecus-aspire}"

# 引数パース
VERSION="latest"
DB_RESET_MODE="false"
for arg in "$@"; do
    case "$arg" in
        --db-reset)
            DB_RESET_MODE="true"
            ;;
        -*)
            echo "❌ 不明なオプション: $arg"
            exit 1
            ;;
        *)
            VERSION="$arg"
            ;;
    esac
done

# スクリプト自身のパスとハッシュ（自己更新検出用）
SCRIPT_PATH="$SCRIPT_DIR/pull-and-deploy.sh"
SCRIPT_HASH_BEFORE=""
if command -v md5sum > /dev/null 2>&1; then
    SCRIPT_HASH_BEFORE=$(md5sum "$SCRIPT_PATH" | cut -d' ' -f1)
elif command -v md5 > /dev/null 2>&1; then
    SCRIPT_HASH_BEFORE=$(md5 -q "$SCRIPT_PATH")
fi

# 全サービスの定義（空白区切り）
ALL_SERVICES="pecus-webapi pecus-frontend pecus-backfire pecus-dbmanager lexicalconverter"

echo "========================================="
echo "  Pecus イメージプル & デプロイ"
echo "========================================="
echo ""
echo "レジストリ: $REGISTRY"
echo "バージョン: $VERSION"
echo ""

# Step 0: Git pull で最新スクリプトを取得
echo "📥 最新スクリプトを取得中..."
if [ -d "$REPO_ROOT/.git" ]; then
    if git -C "$REPO_ROOT" pull; then
        echo "✅ Git pull 完了"

        # スクリプト自身が更新されたかチェック
        if [ -n "$SCRIPT_HASH_BEFORE" ]; then
            SCRIPT_HASH_AFTER=""
            if command -v md5sum > /dev/null 2>&1; then
                SCRIPT_HASH_AFTER=$(md5sum "$SCRIPT_PATH" | cut -d' ' -f1)
            elif command -v md5 > /dev/null 2>&1; then
                SCRIPT_HASH_AFTER=$(md5 -q "$SCRIPT_PATH")
            fi

            if [ "$SCRIPT_HASH_BEFORE" != "$SCRIPT_HASH_AFTER" ]; then
                echo ""
                echo "⚠️  このスクリプト自身が更新されました。"
                echo "   最新版で再実行してください:"
                echo "   $0 $*"
                exit 0
            fi
        fi
    else
        echo "⚠️  Git pull に失敗しました。続行します..."
    fi
else
    echo "⚠️  .git ディレクトリが見つかりません。Git pull をスキップします。"
fi
echo ""

# Step 1: ビルドPCから設定ファイルを取得
echo "📡 ビルドPCから設定ファイルを取得しています..."
mkdir -p "$REPO_ROOT/config"
# ssh + tar で1回の接続で複数ファイルを転送
if ssh "${BUILD_PC_USER}@${BUILD_PC_IP}" \
    "tar cf - -C ${BUILD_PC_PROJECT_PATH}/config settings.base.json settings.base.prod.json" \
    | tar xf - -C "$REPO_ROOT/config"; then
    echo "   ✅ 設定ファイルを取得しました"
else
    echo "   ❌ 設定ファイルの取得に失敗しました"
    echo "   トラブルシューティング:"
    echo "     1. SSH接続確認: ssh ${BUILD_PC_USER}@${BUILD_PC_IP}"
    echo "     2. ファイル存在確認: ls ${BUILD_PC_PROJECT_PATH}/config/"
    exit 1
fi
echo ""

# Step 2: 設定ファイルから deploy/.env を生成
echo "⚙️  deploy/.env を生成しています..."
if [ -f "$REPO_ROOT/scripts/generate-appsettings.js" ]; then
    node "$REPO_ROOT/scripts/generate-appsettings.js" -P
    echo ""
else
    echo "⚠️  scripts/generate-appsettings.js が見つかりません。"
    echo "   deploy/.env が最新であることを確認してください。"
    echo ""
fi

# Step 3: 現在のアクティブスロット判定
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

# Step 4: イメージのプル
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

# Step 5: プルしたイメージにローカルタグを付与
echo "🏷️  イメージにローカルタグを付与しています..."

# サービス名とcomposeで使用するイメージ名のマッピング
tag_image() {
    src="$REGISTRY/$1:$VERSION"
    dst="$2"
    if docker tag "$src" "$dst"; then
        echo "   ✅ $dst"
    else
        echo "   ❌ Failed to tag: $dst"
        return 1
    fi
}

# Blue/Green 両方にタグ付け（どちらにデプロイするか分からないので）
tag_image "pecus-webapi" "coati-webapi-blue:local"
tag_image "pecus-webapi" "coati-webapi-green:local"
tag_image "pecus-frontend" "coati-frontend-blue:local"
tag_image "pecus-frontend" "coati-frontend-green:local"
tag_image "pecus-backfire" "coati-backfire-blue:local"
tag_image "pecus-backfire" "coati-backfire-green:local"
tag_image "pecus-dbmanager" "coati-dbmanager:local"
tag_image "lexicalconverter" "coati-lexicalconverter:local"

echo ""

# Step 5.5: infraが未起動の場合は起動
echo "🔍 Infraサービスの状態を確認中..."
if [ -f "$OPS_DIR/lib.sh" ]; then
    # lib.sh を読み込んで check_infra_healthy を使用
    # shellcheck disable=SC2034
    script_dir="$OPS_DIR"
    . "$OPS_DIR/lib.sh"

    if ! check_infra_healthy 2>/dev/null; then
        echo "⚠️  Infraサービスが起動していないか、異常な状態です。"
        echo "🚀 Infraサービスを起動中..."
        if sh "$OPS_DIR/infra-up.sh"; then
            echo "✅ Infraサービスの起動完了"
        else
            echo "❌ Infraサービスの起動に失敗しました"
            exit 1
        fi
    else
        echo "✅ Infraサービスは正常に稼働中"
    fi
else
    echo "⚠️  ops/lib.sh が見つかりません。infraの状態確認をスキップします。"
fi
echo ""

# Step 5.6: DBリセット（--db-reset オプション指定時のみ）
if [ "$DB_RESET_MODE" = "true" ]; then
    echo "========================================="
    echo "  ⚠️  DBリセットモード"
    echo "========================================="
    echo ""
    echo "警告: データベースを完全に初期化します。"
    echo "      全てのデータが失われます！"
    echo ""
    printf "続行しますか？[y/N]: "
    read -r answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
        echo "キャンセルしました。"
        exit 0
    fi
    echo ""

    echo "🛑 アプリケーションを停止中..."
    (cd "$OPS_DIR" && sh ./app-down.sh -y)
    echo ""

    echo "🗑️  DBリセット & マイグレーション実行中..."
    # db-reset-migrate.sh 内の確認プロンプトをスキップするため -y を渡す
    # カレントディレクトリを ops/ に変更して実行（相対パス参照のため）
    (cd "$OPS_DIR" && sh ./db-reset-migrate.sh -y)
    echo ""
    echo "✅ DBリセット完了"
    echo ""
fi

# Step 6: switch-node.sh でデプロイ実行（--no-build オプション使用）
echo "🚀 $TARGET_SLOT スロットへデプロイ中..."
echo ""

if [ ! -f "$OPS_DIR/switch-node.sh" ]; then
    echo "❌ ops/switch-node.sh が見つかりません。"
    exit 1
fi

# --no-build オプションを使用して、ビルドをスキップ
# DBリセットモードの場合は --skip-migration も追加（既にマイグレーション済み）
SWITCH_OPTS="--no-build"
if [ "$DB_RESET_MODE" = "true" ]; then
    SWITCH_OPTS="$SWITCH_OPTS --skip-migration"
fi

if (cd "$OPS_DIR" && sh ./switch-node.sh "$TARGET_SLOT" $SWITCH_OPTS); then
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
