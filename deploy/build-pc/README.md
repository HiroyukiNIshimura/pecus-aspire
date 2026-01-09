# ビルドPC セットアップガイド

## 概要

このディレクトリには、ビルド専用PCで Docker イメージをビルドし、プライベートレジストリにプッシュするためのスクリプトが含まれています。

---

## 前提条件

- Docker および Docker Compose がインストールされていること
- Node.js がインストールされていること（appsettings.json 生成に必要）
- ソースコードリポジトリがクローン済みであること
- 十分なディスク容量（イメージビルド + レジストリストレージ）
- `config/settings.base.prod.json` が設定されていること（本番用設定）

---

## 初回セットアップ

### 1. 環境変数の設定

```bash
cd deploy/build-pc
cp .env.example .env
```

`.env` ファイルを編集:

```bash
# レジストリホスト（ビルドPC自身の場合は localhost）
REGISTRY_HOST=localhost

# レジストリポート
REGISTRY_PORT=5000
```

### 2. レジストリコンテナの起動

```bash
./setup-registry.sh
```

このスクリプトは以下を実行します:
- `docker-compose.registry.yml` を使用してレジストリコンテナを起動
- データ永続化用のボリュームを作成
- レジストリの動作確認

---

## 日常運用

### ビルド & プッシュ

```bash
./build-and-push.sh
```

このスクリプトは以下を実行します:
1. Git pull で最新ソースコードを取得
2. `appsettings.json` を本番設定で生成（`config/settings.base.prod.json` を使用）
3. 全サービス（WebApi, Frontend, BackFire, DbManager, LexicalConverter）をビルド
4. バージョンタグ（`YYYYMMDDHHMMSS`）と `latest` タグでレジストリにプッシュ
5. ビルド結果のサマリーを表示

> **Note**: `appsettings.json` は `.gitignore` で除外されているため、スクリプトが自動生成します。

### 特定サービスのみビルド

```bash
./build-and-push.sh pecus-webapi pecus-frontend
```

### レジストリ内のタグ一覧確認

```bash
./list-tags.sh
```

ビルド済みのイメージとタグを確認できます。デプロイ前のバージョン確認に便利です。

### 古いイメージのクリーンアップ

```bash
# 30日以前のイメージを削除
./cleanup-old-images.sh 30

# デフォルト（7日）
./cleanup-old-images.sh
```

---

## トラブルシューティング

### レジストリにアクセスできない

```bash
# レジストリコンテナの状態確認
docker ps | grep pecus-registry

# レジストリログ確認
docker logs pecus-registry

# レジストリ再起動
docker restart pecus-registry
```

### ディスク容量不足

```bash
# 未使用イメージの削除
docker system prune -a

# レジストリストレージの確認
du -sh ../data/registry
```

### プッシュが失敗する

```bash
# Docker daemon 設定確認
cat /etc/docker/daemon.json

# insecure-registries が設定されているか確認
# 設定されていない場合は追加して Docker 再起動
sudo systemctl restart docker
```

---

## ディレクトリ構造

```
build-pc/
├── README.md                   # このファイル
├── setup-registry.sh           # レジストリ初期構築
├── build-and-push.sh           # ビルド & プッシュ
├── list-tags.sh                # タグ一覧表示
├── cleanup-old-images.sh       # 古いイメージ削除
├── .env.example                # 環境変数テンプレート
└── .env                        # 環境変数（git ignore）
```

---

## セキュリティ考慮事項

- レジストリポート（デフォルト 5000）へのアクセスは LAN 内に限定すること
- 本番運用では Basic 認証または TLS 証明書の設定を推奨
- `.env` ファイルは `.gitignore` に追加されています

---

## 関連ドキュメント

- [SEPARATE_BUILD_ARCHITECTURE.md](../SEPARATE_BUILD_ARCHITECTURE.md) - ビルドPC分離アーキテクチャ全体
- [DEPLOY_OVERVIEW.md](../DEPLOY_OVERVIEW.md) - デプロイ全体概要
- [deploy-pc/README.md](../deploy-pc/README.md) - デプロイPC側のセットアップ

---

*最終更新: 2026-01-08*
