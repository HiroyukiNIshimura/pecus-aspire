# デプロイPC セットアップガイド

## 概要

このディレクトリには、デプロイ専用PCでビルドPCからイメージをプルし、Blue-Greenデプロイを実行するためのスクリプトが含まれています。

---

## 前提条件

- Docker および Docker Compose がインストールされていること
- ビルドPCとネットワーク接続されていること
- 運用スクリプト (`ops/`) が利用可能であること

---

## 初回セットアップ

### 1. 環境変数の設定

```bash
cd deploy/deploy-pc
cp .env.example .env
```

`.env` ファイルを編集:

```bash
# ビルドPCのIPアドレスまたはホスト名
BUILD_PC_IP=192.168.1.100

# レジストリポート（ビルドPC側と同じ）
REGISTRY_PORT=5000
```

### 2. Docker Daemon の設定

```bash
sudo ./setup-docker-daemon.sh
```

このスクリプトは以下を実行します:
- `/etc/docker/daemon.json` に `insecure-registries` を追加
- Docker デーモンの再起動
- 設定の動作確認

**注意**: このスクリプトは sudo 権限が必要です。

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
