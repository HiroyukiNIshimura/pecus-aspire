#!/bin/sh
# =============================================================================
# Pecus Aspire - 本番デプロイスクリプト
# =============================================================================
# 使い方:
#   ./deploy.sh                    # 通常デプロイ
#   ./deploy.sh --rebuild          # イメージを再ビルドしてデプロイ
#   ./deploy.sh --generate-only    # 設定生成のみ（デプロイしない）
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_DIR="$ROOT_DIR/config"
DEPLOY_DIR="$SCRIPT_DIR"

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# 前提条件チェック
# =============================================================================
check_prerequisites() {
    log_info "前提条件をチェック中..."

    # Node.js
    if ! command -v node > /dev/null 2>&1; then
        log_error "Node.js がインストールされていません"
        exit 1
    fi

    # Docker
    if ! command -v docker > /dev/null 2>&1; then
        log_error "Docker がインストールされていません"
        exit 1
    fi

    # Docker Compose
    if ! docker compose version > /dev/null 2>&1; then
        log_error "Docker Compose がインストールされていません"
        exit 1
    fi

    # 設定ファイル
    if [ ! -f "$CONFIG_DIR/settings.base.json" ]; then
        log_error "config/settings.base.json が見つかりません"
        exit 1
    fi

    if [ ! -f "$CONFIG_DIR/settings.base.prod.json" ]; then
        log_error "config/settings.base.prod.json が見つかりません"
        log_info "テンプレートからコピーしてください:"
        log_info "  cp config/settings.base.prod.json.example config/settings.base.prod.json"
        log_info "このファイルにはアプリ設定（JWT, AI, メール等）を記述します"
        exit 1
    fi

    log_info "前提条件チェック完了"
}

# =============================================================================
# 設定ファイル生成
# =============================================================================
generate_appsettings() {
    log_info "appsettings.json を生成中..."

    cd "$ROOT_DIR"
    node scripts/generate-appsettings.js -P

    if [ $? -eq 0 ]; then
        log_info "設定ファイル生成完了"
    else
        log_error "設定ファイル生成に失敗しました"
        exit 1
    fi
}

# =============================================================================
# Docker イメージビルド
# =============================================================================
build_images() {
    log_info "Docker イメージをビルド中..."

    cd "$DEPLOY_DIR"
    docker compose build

    if [ $? -eq 0 ]; then
        log_info "イメージビルド完了"
    else
        log_error "イメージビルドに失敗しました"
        exit 1
    fi
}

# =============================================================================
# サービス起動
# =============================================================================
start_services() {
    log_info "サービスを起動中..."

    cd "$DEPLOY_DIR"
    docker compose up -d

    if [ $? -eq 0 ]; then
        log_info "サービス起動完了"
    else
        log_error "サービス起動に失敗しました"
        exit 1
    fi
}

# =============================================================================
# ヘルスチェック
# =============================================================================
health_check() {
    log_info "ヘルスチェック中..."

    # dbmanager の完了を待機（最大5分）
    log_info "DB マイグレーションの完了を待機中..."
    TIMEOUT=300
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
        STATUS=$(docker inspect --format='{{.State.Status}}' pecus-dbmanager 2>/dev/null || echo "not_found")
        if [ "$STATUS" = "exited" ]; then
            EXIT_CODE=$(docker inspect --format='{{.State.ExitCode}}' pecus-dbmanager 2>/dev/null || echo "1")
            if [ "$EXIT_CODE" = "0" ]; then
                log_info "DB マイグレーション完了"
                break
            else
                log_error "DB マイグレーションが失敗しました (exit code: $EXIT_CODE)"
                log_info "ログを確認: docker compose logs dbmanager"
                exit 1
            fi
        fi
        sleep 5
        ELAPSED=$((ELAPSED + 5))
        printf "."
    done
    printf "\n"

    if [ $ELAPSED -ge $TIMEOUT ]; then
        log_error "DB マイグレーションがタイムアウトしました"
        exit 1
    fi

    # API ヘルスチェック（最大2分）
    log_info "API ヘルスチェック中..."
    TIMEOUT=120
    ELAPSED=0
    while [ $ELAPSED -lt $TIMEOUT ]; do
        if docker compose exec -T pecusapi curl -sf http://localhost:8080/health > /dev/null 2>&1; then
            log_info "API ヘルスチェック OK"
            break
        fi
        sleep 5
        ELAPSED=$((ELAPSED + 5))
        printf "."
    done
    printf "\n"

    if [ $ELAPSED -ge $TIMEOUT ]; then
        log_warn "API ヘルスチェックがタイムアウトしました（起動中の可能性あり）"
    fi
}

# =============================================================================
# ステータス表示
# =============================================================================
show_status() {
    echo ""
    log_info "=== サービスステータス ==="
    cd "$DEPLOY_DIR"
    docker compose ps
    echo ""
    log_info "ログ確認: cd deploy && docker compose logs -f"
    log_info "停止: cd deploy && docker compose down"
}

# =============================================================================
# メイン処理
# =============================================================================
main() {
    REBUILD=false
    GENERATE_ONLY=false

    # 引数解析
    for arg in "$@"; do
        case $arg in
            --rebuild)
                REBUILD=true
                ;;
            --generate-only)
                GENERATE_ONLY=true
                ;;
            --help|-h)
                echo "使い方: $0 [オプション]"
                echo ""
                echo "オプション:"
                echo "  --rebuild        イメージを再ビルドしてデプロイ"
                echo "  --generate-only  設定生成のみ（デプロイしない）"
                echo "  --help, -h       このヘルプを表示"
                exit 0
                ;;
        esac
    done

    echo "========================================"
    echo " Pecus Aspire - 本番デプロイ"
    echo "========================================"
    echo ""

    check_prerequisites
    generate_appsettings

    if [ "$GENERATE_ONLY" = true ]; then
        log_info "設定生成のみモード - デプロイをスキップ"
        exit 0
    fi

    if [ "$REBUILD" = true ]; then
        build_images
    fi

    start_services
    health_check
    show_status

    echo ""
    log_info "デプロイ完了！"
}

main "$@"
