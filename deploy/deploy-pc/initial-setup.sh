#!/bin/sh
set -eu

# ============================================
# Coati 統合初期セットアップ
# ============================================
# 用途: 新しいサーバーで Coati 環境を一括構築する
# 実行ユーザー: root（sudo ./initial-setup.sh）
# 実行タイミング: サーバー初回セットアップ時のみ
#
# 処理内容:
#   1. coati ユーザー作成（既存ならスキップ）
#   2. .env ファイル確認
#   3. CONTAINER_UID/GID を .env に自動設定
#   4. Docker daemon 設定（insecure-registries）
#   5. データディレクトリ作成 & 権限設定
#   6. nvm & Node.js LTS インストール（coati ユーザーで実行）
#   7. アプリケーション設定ファイル生成（coati ユーザーで実行）
#
# 以降の運用は coati ユーザーで:
#   su - coati
#   cd /path/to/deploy/deploy-pc
#   ./pull-and-deploy.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COATI_USER="coati"

echo "========================================="
echo "  Coati 初期セットアップ"
echo "========================================="

# ----------------------------------------
# 1. root チェック
# ----------------------------------------
if [ "$(id -u)" -ne 0 ]; then
  echo "[Error] root 権限で実行してください: sudo $0" >&2
  exit 1
fi

# ----------------------------------------
# 2. coati ユーザー作成
# ----------------------------------------
if id "$COATI_USER" >/dev/null 2>&1; then
  echo "[OK] ユーザー '$COATI_USER' は既に存在します"
else
  echo "[Info] ユーザー '$COATI_USER' を作成します..."
  useradd -m -s /bin/bash "$COATI_USER"
  echo "[OK] ユーザー '$COATI_USER' を作成しました"
fi

# docker グループに追加（既に追加されていれば無害）
usermod -aG docker "$COATI_USER" 2>/dev/null || true
echo "[OK] '$COATI_USER' を docker グループに追加しました"

# coati ユーザーの UID/GID を取得
COATI_UID="$(id -u "$COATI_USER")"
COATI_GID="$(id -g "$COATI_USER")"
echo "[Info] $COATI_USER UID=$COATI_UID, GID=$COATI_GID"

# ----------------------------------------
# 3. .env ファイル確認
# ----------------------------------------
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo ""
  echo "📝 .env ファイルをテンプレートから作成します"
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  chown "$COATI_UID:$COATI_GID" "$SCRIPT_DIR/.env"
  echo "[Warn] $SCRIPT_DIR/.env を編集（BUILD_PC_IP 等）してから再実行してください"
  exit 1
fi

# ----------------------------------------
# 4. CONTAINER_UID/GID を .env に自動設定
# ----------------------------------------
for var in CONTAINER_UID CONTAINER_GID; do
  val=$([ "$var" = "CONTAINER_UID" ] && echo "$COATI_UID" || echo "$COATI_GID")
  if grep -q "^${var}=" "$SCRIPT_DIR/.env" 2>/dev/null; then
    sed -i "s/^${var}=.*/${var}=${val}/" "$SCRIPT_DIR/.env"
  else
    echo "${var}=${val}" >> "$SCRIPT_DIR/.env"
  fi
done
echo "[OK] CONTAINER_UID=$COATI_UID, CONTAINER_GID=$COATI_GID を .env に設定しました"

# ----------------------------------------
# 5. Docker daemon 設定
# ----------------------------------------
echo ""
echo "🐳 Docker daemon 設定..."
"$SCRIPT_DIR/setup-docker-daemon.sh"

# ----------------------------------------
# 6. データディレクトリ作成
# ----------------------------------------
echo ""
echo "📁 データディレクトリ作成..."
COATI_UID="$COATI_UID" COATI_GID="$COATI_GID" "$SCRIPT_DIR/setup-data-dirs.sh"

# ----------------------------------------
# 7. nvm & Node.js LTS インストール（coati ユーザーで実行）
# ----------------------------------------
echo ""
echo "📦 nvm & Node.js LTS インストール..."
NVM_DIR_PATH="/home/$COATI_USER/.nvm"
if [ -d "$NVM_DIR_PATH" ]; then
  echo "[OK] nvm は既にインストールされています ($NVM_DIR_PATH)"
else
  echo "[Info] nvm をインストールします..."
  su - "$COATI_USER" -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash'
  echo "[OK] nvm をインストールしました"
fi

# Node.js LTS をインストール（既にあればスキップ）
su - "$COATI_USER" -c '. "$HOME/.nvm/nvm.sh" && nvm install --lts && nvm alias default lts/* && node --version'
echo "[OK] Node.js LTS をインストールしました"

# ----------------------------------------
# 8. 設定ファイル生成（coati ユーザーで実行）
# ----------------------------------------
echo ""
echo "⚙️ 設定ファイル生成..."
su - "$COATI_USER" -c '. "$HOME/.nvm/nvm.sh" && cd '"'$(cd "$SCRIPT_DIR/../.." && pwd)'"' && node scripts/generate-appsettings.js -P'

echo ""
echo "========================================="
echo "✅ 初期セットアップ完了"
echo "========================================="
echo ""
echo "以降はすべて $COATI_USER ユーザーで操作してください:"
echo "  su - $COATI_USER"
echo "  cd $SCRIPT_DIR"
echo "  ./pull-and-deploy.sh"
