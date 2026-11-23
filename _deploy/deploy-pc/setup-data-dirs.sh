#!/bin/sh
set -eu

# ============================================
# データディレクトリ作成 & 権限設定
# ============================================
# 用途: ホスト上のデータディレクトリを作成し、coati ユーザーに権限を設定
# 実行ユーザー: root（initial-setup.sh 経由、または sudo で単独実行）
# 実行タイミング: 初回セットアップ時、またはディレクトリ追加が必要な場合
#
# 使い方:
#   sudo ./setup-data-dirs.sh
#   COATI_UID=1000 COATI_GID=1000 ./setup-data-dirs.sh  (initial-setup.sh 経由)

# root チェック
if [ "$(id -u)" -ne 0 ]; then
  echo "[Error] root 権限で実行してください: sudo $0" >&2
  exit 1
fi

DATA_PATH="${DATA_PATH:-/var/docker/coati/data}"

# coati ユーザーの UID/GID を取得
# 環境変数が設定されていればそれを使用、なければ coati ユーザーから自動検出
if [ -z "${COATI_UID:-}" ] || [ -z "${COATI_GID:-}" ]; then
  if ! id coati >/dev/null 2>&1; then
    echo "[Error] coati ユーザーが存在しません。initial-setup.sh を先に実行してください" >&2
    exit 1
  fi
  COATI_UID="$(id -u coati)"
  COATI_GID="$(id -g coati)"
fi

echo "[Info] coati ユーザー UID=$COATI_UID, GID=$COATI_GID"
echo "[Info] DATA_PATH=$DATA_PATH"

# ディレクトリ作成
mkdir -p "$DATA_PATH/postgres"
mkdir -p "$DATA_PATH/redis"
mkdir -p "$DATA_PATH/redis-frontend"
mkdir -p "$DATA_PATH/uploads"
mkdir -p "$DATA_PATH/notifications"
mkdir -p "$DATA_PATH/logs/webapi-blue"
mkdir -p "$DATA_PATH/logs/webapi-green"
mkdir -p "$DATA_PATH/logs/backfire-blue"
mkdir -p "$DATA_PATH/logs/backfire-green"
mkdir -p "$DATA_PATH/logs/dbmanager"
mkdir -p "$DATA_PATH/backups/postgres"
mkdir -p "$DATA_PATH/prometheus"

# 権限設定（PostgreSQL 以外）
# ⚠️ postgres/ は chown しない（PostgreSQL は postgres ユーザーで動作）
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/redis"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/redis-frontend"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/uploads"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/notifications"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/logs"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/backups"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/prometheus"

# PostgreSQL は postgres ユーザー（UID 70 または 999）で動作
# 初回起動時に Docker が自動で権限設定するため、空のままにしておく
# ⚠️ 絶対に postgres/ を chown しないこと！

echo ""
echo "✅ データディレクトリを作成しました: $DATA_PATH"
echo "⚠️  postgres/ は PostgreSQL 初回起動時に自動設定されます（chown 不要）"
