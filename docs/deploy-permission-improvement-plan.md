# デプロイスクリプト パーミッション改善計画

## 概要

本番環境構築時にパーミッション関連で繰り返し問題が発生している。本ドキュメントは問題の根本原因を特定し、改善計画をまとめる。

---

## 前提条件

### デプロイ環境の運用ユーザー

デプロイ環境（本番・検証サーバー）には専用の `coati` ユーザーを使用する。
**`initial-setup.sh` を root で実行すると `coati` ユーザーの作成から環境構築まで一括で完了する。**

| 操作 | 実行ユーザー | 備考 |
|------|-------------|------|
| **初期セットアップ** | `root`（または sudo） | `initial-setup.sh` が `coati` ユーザー作成・環境構築を一括実行 |
| **日常運用（デプロイ・バックアップ・切替等）** | `coati` | `ops/` 配下のスクリプトを使用 |
| **メンテナンス** | `coati` | 以降のすべての操作は `coati` で実施 |

```bash
# 初回セットアップ（root で実行、coati ユーザー作成含む）
sudo ./initial-setup.sh

# 以降はすべて coati ユーザーで操作
su - coati
cd /path/to/deploy/deploy-pc
./pull-and-deploy.sh
```

### コンテナ UID/GID の原則

- コンテナ内プロセスの `user` 設定（`CONTAINER_UID` / `CONTAINER_GID`）は `coati` ユーザーの UID/GID と一致させる
- これにより、コンテナが作成したファイルをホスト側の `coati` ユーザーが直接読み書き・削除できる
- `initial-setup.sh` が `coati` ユーザーの UID/GID を自動検出し、`deploy/.env` に `CONTAINER_UID` / `CONTAINER_GID` を自動設定するため、手動設定は不要

---

## 現状の問題点

### 1. UID/GID 設定の不整合

#### 問題箇所

| ファイル | 設定値 | 問題点 |
|----------|--------|--------|
| `docker-compose.infra.yml` (redis) | `${CONTAINER_UID:-1001}:${CONTAINER_GID:-1001}` | 変数参照（OK） |
| `docker-compose.app-blue.yml` | `${CONTAINER_UID:-1001}:${CONTAINER_GID:-1001}` | 変数参照（OK） |
| `docker-compose.migrate.yml` | `user: "1001:1001"` | **ハードコード（問題）** |
| `docker-compose.backup.yml` | 未設定（root で実行） | **バックアップファイルが root 権限で作成される** |
| `docker-compose.restore-helper.yml` | 未設定（root で実行） | PostgreSQL の postgres イメージを使用（問題なし） |

#### 対策

- [ ] `docker-compose.migrate.yml` の `user` を `${CONTAINER_UID:-1001}:${CONTAINER_GID:-1001}` に変更
- [ ] 全 docker-compose ファイルで UID/GID 設定を統一
- [ ] PostgreSQL はルート権限で動作（変更不要）

---

### 2. ホストディレクトリの事前作成不足

#### 必要なディレクトリ構造

```
/var/docker/coati/data/
├── postgres/           # PostgreSQL データ（postgres:postgres 権限）
├── redis/              # Redis データ（CONTAINER_UID:CONTAINER_GID 権限）
├── redis-frontend/     # Redis Frontend データ（CONTAINER_UID:CONTAINER_GID 権限）
├── uploads/            # アップロードファイル（CONTAINER_UID:CONTAINER_GID 権限）
├── notifications/      # 通知データ（CONTAINER_UID:CONTAINER_GID 権限）
├── logs/
│   ├── webapi-blue/    # WebAPI ログ（CONTAINER_UID:CONTAINER_GID 権限）
│   ├── webapi-green/
│   ├── backfire-blue/  # BackFire ログ（CONTAINER_UID:CONTAINER_GID 権限）
│   ├── backfire-green/
│   └── dbmanager/      # DbManager ログ（CONTAINER_UID:CONTAINER_GID 権限）
└── backups/
    └── postgres/       # バックアップファイル
```

#### 対策

- [ ] 初期セットアップスクリプト `deploy/deploy-pc/setup-data-dirs.sh` を作成
- [ ] スクリプトで必要なディレクトリを自動作成し、適切な権限を設定

---

### 3. 初期セットアップ手順の不明確さ

#### 現状

- `deploy-pc/README.md` にセットアップ手順があるが分散・不完全
- 手順を飛ばしやすく、パーミッション問題の原因に

#### 対策

- [ ] `deploy/deploy-pc/initial-setup.sh` を作成（ワンコマンドでセットアップ完了）
- [ ] README を更新し、`initial-setup.sh` を最初に実行するよう明記

---

### 4. PostgreSQL ディレクトリの特殊性

#### 問題

PostgreSQL 18+ は `/var/lib/postgresql` にマウントが必要（`/var/lib/postgresql/data` ではない）。
初回起動時に既存ディレクトリがあると `initdb` が失敗することがある。

#### 対策

- [ ] PostgreSQL データディレクトリは空であることを確認するチェックを追加
- [ ] または、ディレクトリが存在する場合は警告を出す

---

### 5. バックアップファイルの権限問題

#### 問題

`docker-compose.backup.yml` の `pgbackup` サービスは postgres:18-alpine イメージを使用しており、
コンテナ内で root 権限で実行される。これにより、バックアップファイルが `root:root` 権限で作成される。

結果として：
- coati ユーザーがバックアップファイルを削除・上書きできない
- 古いバックアップの自動削除が失敗する可能性

#### 対策

- [ ] `docker-compose.backup.yml` に `user: "${CONTAINER_UID:-1001}:${CONTAINER_GID:-1001}"` を追加
- [ ] または、バックアップ後に `chown` でファイル権限を変更するコマンドを追加

---

## 改善タスク一覧

### Phase 1: 緊急対応（即時実施可能）

| No | タスク | ファイル | 優先度 |
|----|--------|----------|--------|
| 1-1 | `docker-compose.migrate.yml` の UID/GID をハードコードから変数に変更 | `docker-compose.migrate.yml` | 🔴 高 |
| 1-2 | `docker-compose.backup.yml` に user 設定を追加 | `docker-compose.backup.yml` | 🔴 高 |
| 1-3 | バックアップディレクトリの権限を事前チェック | `ops/pg-backup.sh` | 🟠 中 |

### Phase 2: セットアップ自動化

| No | タスク | ファイル | 優先度 |
|----|--------|----------|--------|
| 2-1 | データディレクトリ作成スクリプト作成 | `deploy-pc/setup-data-dirs.sh` | 🟠 中 |
| 2-2 | 統合初期セットアップスクリプト作成 | `deploy-pc/initial-setup.sh` | 🟠 中 |
| 2-3 | `lib.sh` にディレクトリ存在・権限チェック関数追加 | `ops/lib.sh` | 🟠 中 |

**目標**: README.md に記載されている以下の手動コマンドを `setup-data-dirs.sh` で自動化：

```bash
# 現状は手動実行が必要（README.md より）
sudo mkdir -p /var/docker/coati/data/{postgres,redis,redis-frontend,uploads,notifications,backups/postgres}
sudo mkdir -p /var/docker/coati/data/logs/{webapi-blue,webapi-green,backfire-blue,backfire-green,dbmanager}
sudo chown -R $(id -u coati):$(id -g coati) /var/docker/coati/data/redis
sudo chown -R $(id -u coati):$(id -g coati) /var/docker/coati/data/redis-frontend
# ... 以下省略
```

**自動化後のフロー**:
```bash
# 初回セットアップ時（root で実行、coati ユーザー作成含む）
sudo ./initial-setup.sh

# 再実行時（ディレクトリ追加が必要な場合など）
sudo ./setup-data-dirs.sh
```

### Phase 3: 運用改善

| No | タスク | ファイル | 優先度 |
|----|--------|----------|--------|
| 3-1 | `infra-up.sh` でディレクトリ事前チェック追加 | `ops/infra-up.sh` | 🟡 低 |
| 3-2 | README 更新（初期セットアップ手順の明確化） | `deploy-pc/README.md` | 🟡 低 |
| 3-3 | 環境構築チェックリストの追加 | `deploy/DEPLOY_OVERVIEW.md` | 🟡 低 |

---

## 新規スクリプト設計

### `deploy/deploy-pc/setup-data-dirs.sh`

> **実行ユーザー**: `root`（`initial-setup.sh` から呼び出し、または単独で `sudo` 実行）
> **UID/GID**: 環境変数 `COATI_UID` / `COATI_GID` を使用。未設定の場合は `id -u coati` / `id -g coati` で自動検出

```sh
#!/bin/sh
set -eu

# 用途: データディレクトリを作成し、適切な権限を設定
# 実行ユーザー: root（initial-setup.sh から呼び出し、または sudo で実行）
# 実行タイミング: 初回セットアップ時

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

# 権限設定（PostgreSQL 以外）
# ⚠️ postgres/ は chown しない（PostgreSQL は postgres ユーザーで動作）
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/redis"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/redis-frontend"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/uploads"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/notifications"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/logs"
chown -R "$COATI_UID:$COATI_GID" "$DATA_PATH/backups"

# PostgreSQL は postgres ユーザー（UID 70 または 999）で動作
# 初回起動時に Docker が自動で権限設定するため、空のままにしておく
# ⚠️ 絶対に postgres/ を chown しないこと！
echo "✅ データディレクトリを作成しました: $DATA_PATH"
echo "⚠️  postgres/ は PostgreSQL 初回起動時に自動設定されます（chown 不要）"
```

### `deploy/deploy-pc/initial-setup.sh`

> **実行ユーザー**: `root`（`coati` ユーザー作成・Docker 設定・ディレクトリ作成を一括実行）
> **以降の運用**: セットアップ完了後は `coati` ユーザーですべての操作を行う

```sh
#!/bin/sh
set -eu

# 統合初期セットアップスクリプト
# 実行ユーザー: root
# 実行順序:
# 1. root チェック
# 2. coati ユーザー作成（既存ならスキップ）
# 3. .env ファイル確認
# 4. CONTAINER_UID/GID を .env に自動設定
# 5. Docker daemon 設定
# 6. データディレクトリ作成
# 7. 設定ファイル生成（coati ユーザーで実行）

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COATI_USER="coati"

echo "========================================="
echo "  Coati 初期セットアップ"
echo "========================================="

# 1. root チェック
if [ "$(id -u)" -ne 0 ]; then
    echo "[Error] root 権限で実行してください: sudo $0" >&2
    exit 1
fi

# 2. coati ユーザー作成
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

# 3. .env ファイル確認
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "📝 .env ファイルをテンプレートから作成します"
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    chown "$COATI_UID:$COATI_GID" "$SCRIPT_DIR/.env"
    echo "[Warn] $SCRIPT_DIR/.env を編集（BUILD_PC_IP 等）してから再実行してください"
    exit 1
fi

# 4. CONTAINER_UID/GID を .env に自動設定
# 既存の CONTAINER_UID/GID 行を置換、なければ追記
for var in CONTAINER_UID CONTAINER_GID; do
    val=$([ "$var" = "CONTAINER_UID" ] && echo "$COATI_UID" || echo "$COATI_GID")
    if grep -q "^${var}=" "$SCRIPT_DIR/.env" 2>/dev/null; then
        sed -i "s/^${var}=.*/${var}=${val}/" "$SCRIPT_DIR/.env"
    else
        echo "${var}=${val}" >> "$SCRIPT_DIR/.env"
    fi
done
echo "[OK] CONTAINER_UID=$COATI_UID, CONTAINER_GID=$COATI_GID を .env に設定しました"

# 5. Docker daemon 設定
echo "🐳 Docker daemon 設定..."
"$SCRIPT_DIR/setup-docker-daemon.sh"

# 6. データディレクトリ作成
echo "📁 データディレクトリ作成..."
COATI_UID="$COATI_UID" COATI_GID="$COATI_GID" "$SCRIPT_DIR/setup-data-dirs.sh"

# 7. 設定ファイル生成（coati ユーザーで実行）
echo "⚙️ 設定ファイル生成..."
su - "$COATI_USER" -c "cd '$SCRIPT_DIR/../..' && node scripts/generate-appsettings.js -P"

echo ""
echo "========================================="
echo "✅ 初期セットアップ完了"
echo "========================================="
echo ""
echo "以降はすべて $COATI_USER ユーザーで操作してください:"
echo "  su - $COATI_USER"
echo "  cd $(cd "$SCRIPT_DIR" && pwd)"
echo "  ./pull-and-deploy.sh"
```

---

## 検証チェックリスト

新規環境構築時に確認すべき項目：

- [ ] `id coati` で UID/GID を確認
- [ ] `deploy/.env` の `CONTAINER_UID` / `CONTAINER_GID` が coati ユーザーと一致
- [ ] `/var/docker/coati/data/` 配下のディレクトリが作成済み
- [ ] 各ディレクトリの所有者が適切（`ls -la /var/docker/coati/data/`）
- [ ] `docker info` で insecure-registries が設定済み
- [ ] `scripts/generate-appsettings.js -P` で設定ファイルが生成済み

---

## 関連ドキュメント

- [deploy/DEPLOY_OVERVIEW.md](../deploy/DEPLOY_OVERVIEW.md) - デプロイ全体概要
- [deploy/deploy-pc/README.md](../deploy/deploy-pc/README.md) - デプロイPC セットアップ
- [deploy/ops/README.md](../deploy/ops/README.md) - 運用スクリプト一覧
- [docs/data-directory-structure.md](./data-directory-structure.md) - データディレクトリ構造

---

## 更新履歴

- 2026-03-24: `initial-setup.sh` を root 実行に変更（coati ユーザー自動作成・UID/GID 自動設定）
- 2026-03-24: 前提条件を追加（coati ユーザーでの運用・UID/GID 自動検出）
- 2026-03-23: 初版作成（問題点の洗い出しと改善計画）
