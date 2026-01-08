#!/bin/sh
set -eu

# ================================================================================
# Docker Daemon 設定スクリプト
# ================================================================================
# 用途: insecure-registries 設定を追加し、ビルドPCのレジストリにアクセス可能にする
# 実行タイミング: デプロイPC初回セットアップ時（sudo 権限必要）
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

# OS に応じた daemon.json のパスを決定
if [ "$(uname)" = "Darwin" ]; then
    # macOS (Docker Desktop) - ユーザーディレクトリ
    DAEMON_JSON="$HOME/.docker/daemon.json"
    NEED_SUDO=false
else
    # Linux (Docker Engine) - システムディレクトリ
    DAEMON_JSON="/etc/docker/daemon.json"
    NEED_SUDO=true
fi

echo "========================================="
echo "  Docker Daemon 設定"
echo "========================================="
echo ""
echo "レジストリ: $REGISTRY"
echo "設定ファイル: $DAEMON_JSON"
echo ""

# root 権限チェック（Linux のみ）
if [ "$NEED_SUDO" = true ] && [ "$(id -u)" -ne 0 ]; then
    echo "❌ このスクリプトは root 権限で実行する必要があります。"
    echo "   sudo $0"
    exit 1
fi

# 既存の daemon.json をバックアップ
if [ -f "$DAEMON_JSON" ]; then
    echo "📦 既存の設定をバックアップしています..."
    cp "$DAEMON_JSON" "$DAEMON_JSON.backup.$(date +%Y%m%d%H%M%S)"
    echo "   バックアップ: $DAEMON_JSON.backup.*"
    echo ""
else
    # macOS の場合、.docker ディレクトリが存在しない可能性がある
    if [ "$(uname)" = "Darwin" ]; then
        mkdir -p "$HOME/.docker"
        echo "📁 $HOME/.docker ディレクトリを作成しました。"
        echo ""
    fi
fi

# daemon.json の作成または更新
echo "📝 insecure-registries を設定しています..."

if [ -f "$DAEMON_JSON" ]; then
    # 既存ファイルがある場合は jq で更新
    if command -v jq > /dev/null 2>&1; then
        # insecure-registries が既に存在するかチェック
        if jq -e ".\"insecure-registries\"" "$DAEMON_JSON" > /dev/null 2>&1; then
            # 既に存在する場合は追加（重複チェック付き）
            if jq -e ".\"insecure-registries\" | index(\"$REGISTRY\")" "$DAEMON_JSON" > /dev/null 2>&1; then
                echo "ℹ️  $REGISTRY は既に設定されています。"
            else
                jq ".\"insecure-registries\" += [\"$REGISTRY\"]" "$DAEMON_JSON" > "$DAEMON_JSON.tmp"
                mv "$DAEMON_JSON.tmp" "$DAEMON_JSON"
                echo "✅ $REGISTRY を追加しました。"
            fi
        else
            # insecure-registries が存在しない場合は新規追加
            jq ". + {\"insecure-registries\": [\"$REGISTRY\"]}" "$DAEMON_JSON" > "$DAEMON_JSON.tmp"
            mv "$DAEMON_JSON.tmp" "$DAEMON_JSON"
            echo "✅ insecure-registries を追加しました。"
        fi
    else
        echo "⚠️  jq がインストールされていません。手動で設定してください。"
        echo ""
        echo "以下を $DAEMON_JSON に追加:"
        echo "{"
        echo "  \"insecure-registries\": [\"$REGISTRY\"]"
        echo "}"
        exit 1
    fi
else
    # ファイルが存在しない場合は新規作成
    echo "{" > "$DAEMON_JSON"
    echo "  \"insecure-registries\": [\"$REGISTRY\"]" >> "$DAEMON_JSON"
    echo "}" >> "$DAEMON_JSON"
    echo "✅ $DAEMON_JSON を作成しました。"
fi

echo ""
echo "📄 現在の設定:"
cat "$DAEMON_JSON"
echo ""

# Docker デーモンの再起動
echo "🔄 Docker デーモンを再起動しています..."

# OS/環境に応じた再起動処理
if [ "$(uname)" = "Darwin" ]; then
    # macOS (Docker Desktop)
    echo "   macOS Docker Desktop を再起動中..."
    osascript -e 'quit app "Docker"' 2>/dev/null || true
    sleep 3
    open -a Docker
    echo "✅ Docker Desktop を再起動しました。"
    echo ""
    echo "⏳ Docker Desktop の起動を待機中（最大60秒）..."

    # Docker Desktop が起動するまで待機
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt 60 ]; do
        if docker ps > /dev/null 2>&1; then
            echo "✅ Docker Desktop が起動しました。"
            break
        fi
        sleep 1
        WAIT_COUNT=$((WAIT_COUNT + 1))
    done

    if [ $WAIT_COUNT -ge 60 ]; then
        echo "⚠️  Docker Desktop の起動がタイムアウトしました。"
        echo "   手動で Docker Desktop を確認してください。"
        exit 1
    fi

elif command -v systemctl > /dev/null 2>&1; then
    # Linux with systemd
    systemctl restart docker
    echo "✅ Docker が再起動しました（systemctl）。"
    echo ""
    echo "⏳ Docker の起動を待機中..."
    sleep 5

elif command -v service > /dev/null 2>&1; then
    # Linux with init.d
    service docker restart
    echo "✅ Docker が再起動しました（service）。"
    echo ""
    echo "⏳ Docker の起動を待機中..."
    sleep 5

else
    # その他の環境
    echo "⚠️  Docker の自動再起動ができません。"
    echo ""
    echo "手動で Docker を再起動してから、次のコマンドを実行してください:"
    echo "   curl http://$REGISTRY/v2/_catalog"
    echo ""
    echo "接続確認できたら Enter を押してください..."
    read -r
fi

echo ""

# 動作確認
echo "🔍 レジストリへの接続確認..."
if docker pull "$REGISTRY/hello-world" > /dev/null 2>&1; then
    echo "✅ レジストリに接続できました（テストイメージでの確認）。"
    docker rmi "$REGISTRY/hello-world" > /dev/null 2>&1 || true
elif curl -s "http://$REGISTRY/v2/_catalog" > /dev/null 2>&1; then
    echo "✅ レジストリに接続できました（HTTP API での確認）。"
else
    echo "⚠️  レジストリへの接続に失敗しました。"
    echo ""
    echo "トラブルシューティング:"
    echo "  1. ビルドPCのIPアドレスが正しいか確認: $BUILD_PC_IP"
    echo "  2. ネットワーク疎通確認: ping $BUILD_PC_IP"
    echo "  3. レジストリが起動しているか確認: curl http://$REGISTRY/v2/_catalog"
    exit 1
fi

echo ""
echo "========================================="
echo "  セットアップ完了"
echo "========================================="
echo ""
echo "次のステップ:"
echo "  - イメージをプル＆デプロイ: ./pull-and-deploy.sh"
echo "  - 手動でイメージ確認: curl http://$REGISTRY/v2/_catalog"
echo ""
