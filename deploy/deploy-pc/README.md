# デプロイPC セットアップガイド

## 概要

このディレクトリには、デプロイ専用PCでビルドPCからイメージをプルし、Blue-Greenデプロイを実行するためのスクリプトが含まれています。

---

## 前提条件

- git, curl, jq などの基本的なコマンドラインツールがインストールされていること
- Docker および Docker Compose がインストールされていること
- ビルドPCとネットワーク接続されていること
- 運用スクリプト (`ops/`) が利用可能であること

---

## 初回セットアップ

`initial-setup.sh` を root で実行すると、以下をすべて自動で行います:
- `coati` ユーザーの作成（既存ならスキップ）
- `CONTAINER_UID` / `CONTAINER_GID` の自動検出と `.env` への書き込み
- Docker daemon 設定（insecure-registries）
- データディレクトリの作成と権限設定
- アプリケーション設定ファイルの生成

```bash
# 1. .env ファイルを準備（初回のみ）
cd deploy/deploy-pc
cp .env.example .env
# → BUILD_PC_IP, REGISTRY_PORT 等を編集

# 2. 初期セットアップ実行（root 権限）
sudo ./initial-setup.sh

# 3. 以降はすべて coati ユーザーで操作
su - coati
cd /path/to/deploy/deploy-pc
./pull-and-deploy.sh
```

> **注意**: `.env` が存在しない場合、`initial-setup.sh` はテンプレートからコピーして終了します。
> `.env` を編集してから再実行してください。

### 手動セットアップ（個別実行が必要な場合）

個別にスクリプトを実行する場合：

```bash
# Docker daemon 設定のみ（ビルドPC の IP 変更時など）
sudo ./setup-docker-daemon.sh

# データディレクトリ作成のみ（ディレクトリ追加が必要な場合）
sudo ./setup-data-dirs.sh
```

### UID/GID について

- コンテナ内プロセスは `coati` ユーザーの UID/GID で動作します
- `initial-setup.sh` が自動で `id -u coati` / `id -g coati` を検出し、`.env` の `CONTAINER_UID` / `CONTAINER_GID` に設定します
- UID が一致しないとログファイルや Redis のデータが書き込めません
- `postgres/` ディレクトリは **chown しないこと**（PostgreSQL は postgres ユーザーで動作し、初回起動時に自動設定される）

---

## 日常運用

### イメージプル & デプロイ

```bash
./pull-and-deploy.sh
```

このスクリプトは以下を実行します:
1. ビルドPCのレジストリから最新イメージ（`latest` タグ）をプル
2. 現在のアクティブノードを判定（Blue または Green）
3. 非アクティブノードで新しいイメージをデプロイ
4. ヘルスチェック完了後、トラフィックを切り替え（`switch-node.sh --no-build`）
5. 旧アクティブノードを停止

### レジストリ内のタグ一覧確認

```bash
./list-tags.sh
```

ビルドPCのレジストリにある全イメージ・タグを表示します。デプロイ可能なバージョンを確認できます。

### 特定バージョンのデプロイ

```bash
# タグ一覧を確認
./list-tags.sh

# 特定のバージョンタグを指定
./pull-and-deploy.sh 20260108214353
```

### DBリセット付きデプロイ（フレッシュデプロイ）

DBスキーマの破壊的変更や、初期状態からのセットアップが必要な場合に使用します。

```bash
# 最新バージョンでフレッシュデプロイ
./fresh-deploy.sh

# 特定バージョンでフレッシュデプロイ
./fresh-deploy.sh 20260108214353
```

**⚠️ 警告**: このコマンドはデータベースを完全に初期化します。全てのデータが失われます。

または、オプションを直接指定することもできます：

```bash
./pull-and-deploy.sh --db-reset
./pull-and-deploy.sh 20260108214353 --db-reset
```

---

## トラブルシューティング

### レジストリに接続できない

```bash
# ネットワーク疎通確認
ping <BUILD_PC_IP>

# レジストリ疎通確認
curl http://<BUILD_PC_IP>:5000/v2/_catalog

# insecure-registries 設定確認
cat /etc/docker/daemon.json

# Docker 再起動
sudo systemctl restart docker
```

### イメージのプルが失敗する

```bash
# レジストリにイメージが存在するか確認
curl http://<BUILD_PC_IP>:5000/v2/_catalog

# 手動でプルを試行
docker pull <BUILD_PC_IP>:5000/pecus-webapi:latest
```

### デプロイが失敗する

```bash
# 運用スクリプトのステータス確認
cd ../ops
./status.sh

# ログ確認
docker logs <container_name>
```

---

## ディレクトリ構造

```
deploy-pc/
├── README.md                   # このファイル
├── setup-docker-daemon.sh      # Docker daemon 設定
├── pull-and-deploy.sh          # プル & デプロイ
├── fresh-deploy.sh             # フレッシュデプロイ（DBリセット付き）
├── list-tags.sh                # タグ一覧表示
├── .env.example                # 環境変数テンプレート
└── .env                        # 環境変数（git ignore）
```

---

## セキュリティ考慮事項

- レジストリとの通信は LAN 内に限定すること
- 本番運用では VPN 経由または TLS 証明書の設定を推奨
- `.env` ファイルは `.gitignore` に追加されています
- `setup-docker-daemon.sh` は sudo 権限が必要（慎重に実行）

---

## Blue-Green デプロイフロー

```
1. 現在の状態確認
   ├─ Blue: Active (port 8080)
   └─ Green: Inactive

2. イメージプル
   └─ ビルドPCから最新イメージを取得

3. 非アクティブノード (Green) 起動
   └─ 新しいイメージで起動

4. ヘルスチェック
   └─ Green が正常に起動したか確認

5. トラフィック切り替え
   ├─ Nginx が Green を向くように設定
   └─ Blue は待機状態

6. 旧ノード停止
   └─ Blue を停止（次回デプロイ時に使用）
```

---

## 関連ドキュメント

- [SEPARATE_BUILD_ARCHITECTURE.md](../SEPARATE_BUILD_ARCHITECTURE.md) - ビルドPC分離アーキテクチャ全体
- [DEPLOY_OVERVIEW.md](../DEPLOY_OVERVIEW.md) - デプロイ全体概要
- [build-pc/README.md](../build-pc/README.md) - ビルドPC側のセットアップ
- [ops/README.md](../ops/README.md) - 運用スクリプト詳細

---

*最終更新: 2026-01-25*
