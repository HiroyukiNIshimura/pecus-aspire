# ビルドPC分離アーキテクチャ

**実装状況**: ✅ 完了（2026-01-08）

## 概要

本番環境でのデプロイ時、Docker イメージのビルドは CPU/メモリを大量消費するため、サービス提供中のデプロイ PC に負荷をかけることになります。本ドキュメントでは、ビルド専用 PC を分離し、プライベートレジストリ経由でイメージを転送するアーキテクチャを定義します。

---

## アーキテクチャ図

```
┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
│          ビルドPC                   │         │          デプロイPC                  │
│                                     │         │                                     │
│  ┌─────────────────────────────┐   │         │  ┌─────────────────────────────┐   │
│  │  ソースコード               │   │         │  │         Nginx               │   │
│  │  docker build               │   │         │  └──────────┬──────────────────┘   │
│  └──────────┬──────────────────┘   │         │             │                       │
│             │                       │         │     ┌───────┴───────┐               │
│             ▼                       │         │     ▼               ▼               │
│  ┌─────────────────────────────┐   │         │  ┌───────────┐  ┌───────────┐      │
│  │  docker push                │   │         │  │ Green     │  │ Blue      │      │
│  │  localhost:5000             │   │  pull   │  │ ノード    │  │ ノード    │      │
│  └──────────┬──────────────────┘   │ ──────► │  │ (APP層)   │  │ (APP層)   │      │
│             │                       │         │  └─────┬─────┘  └─────┬─────┘      │
│             ▼                       │         │        │              │             │
│  ┌─────────────────────────────┐   │         │        └──────┬───────┘             │
│  │  registry:2                 │   │         │               │                     │
│  │  (プライベートレジストリ)    │   │         │               ▼                     │
│  └─────────────────────────────┘   │         │  ┌─────────────────────────────┐   │
│                                     │         │  │      インフラ層              │   │
└─────────────────────────────────────┘         │  │  PostgreSQL, Redis,         │   │
                                                │  │  LexicalConverter           │   │
                                                │  └─────────────────────────────┘   │
                                                └─────────────────────────────────────┘
```

---

## メリット

| 観点 | 説明 |
|------|------|
| **サービス影響軽減** | ビルド時の CPU/メモリ消費がサービスに影響しない |
| **ダウンタイム最小化** | イメージ pull 完了後にノード切り替え |
| **ロールバック容易** | 旧ノードを残しておけば即時切り戻し可能 |
| **push 高速** | ビルド PC 内で localhost push なので転送ゼロ |

---

## 転送方式の比較

| 観点 | `docker save` + scp | プライベートレジストリ |
|------|---------------------|------------------------|
| **初期構築** | 不要 | レジストリコンテナ起動が必要 |
| **転送効率** | 毎回フルイメージ | レイヤー差分のみ（大幅削減） |
| **運用コマンド** | scp + docker load | docker push / pull |
| **複数イメージ管理** | 手動でファイル管理 | タグで自動管理 |
| **ロールバック** | 旧ファイルを保持する必要 | 旧タグを pull するだけ |
| **複数ノード対応** | ノード毎に scp が必要 | 各ノードから pull |

**推奨: プライベートレジストリ方式**

---

## レジストリ配置の選択

| 配置 | 向いているケース |
|------|------------------|
| **ビルドPC** | ビルド頻度が高い、デプロイ PC のリソースを温存したい |
| **デプロイPC** | ビルド PC が不安定、複数のビルド PC がある |

Pecus プロジェクトでは **ビルド PC にレジストリを配置** を推奨します。

---

## 段階的導入

### Phase 1: 1台構成での検証

実験段階では 1 台の PC で Blue-Green デプロイとレジストリの動作を検証可能です。

```
1台のPC
┌─────────────────────────────────────────────┐
│  registry:2 (localhost:5000)                │
│       ↑                                     │
│  docker build → docker push                 │
│       ↓                                     │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ Green ノード │  │ Blue ノード  │          │
│  └─────────────┘  └─────────────┘          │
│       ↑               ↑                     │
│       └───── Nginx ───┘                     │
│                                             │
│  PostgreSQL, Redis（インフラ層）            │
└─────────────────────────────────────────────┘
```

### Phase 2: ビルドPC分離

実験に成功したらビルド PC を分離します。

---

## 実装詳細

### 1. レジストリコンテナ（ビルドPC）

```yaml
# docker-compose.registry.yml
services:
  registry:
    image: registry:2
    container_name: pecus-registry
    restart: always
    ports:
      - "5000:5000"
    volumes:
      - ./data/registry:/var/lib/registry
    environment:
      REGISTRY_STORAGE_DELETE_ENABLED: "true"
```

### 2. ビルド & プッシュスクリプト（ビルドPC）

```bash
#!/bin/bash
# build-and-push.sh

REGISTRY="${REGISTRY_HOST:-localhost}:5000"
VERSION=$(date +%Y%m%d%H%M%S)

SERVICES=("pecus-webapi" "pecus-frontend" "pecus-backfire" "pecus-dbmanager" "lexicalconverter")

for SERVICE in "${SERVICES[@]}"; do
    echo "Building ${SERVICE}..."
    docker build -t ${REGISTRY}/${SERVICE}:${VERSION} -f deploy/dockerfiles/Dockerfile.${SERVICE} .
    docker push ${REGISTRY}/${SERVICE}:${VERSION}

    # latest タグも更新
    docker tag ${REGISTRY}/${SERVICE}:${VERSION} ${REGISTRY}/${SERVICE}:latest
    docker push ${REGISTRY}/${SERVICE}:latest
done

echo "Build complete: version=${VERSION}"
```

### 3. プル & デプロイスクリプト（デプロイPC）

```bash
#!/bin/bash
# pull-and-deploy.sh

REGISTRY="${BUILD_PC_IP}:5000"
NODE="${1:-blue}"  # blue or green

SERVICES=("pecus-webapi" "pecus-frontend" "pecus-backfire" "pecus-dbmanager" "lexicalconverter")

for SERVICE in "${SERVICES[@]}"; do
    echo "Pulling ${SERVICE}..."
    docker pull ${REGISTRY}/${SERVICE}:latest
done

# switch-node.sh を --no-build オプション付きで呼び出し
./ops/switch-node.sh ${NODE} --no-build
```

### 4. Docker daemon 設定（デプロイPC）

HTTP レジストリを使用する場合、デプロイ PC の Docker daemon に設定が必要です。

```json
// /etc/docker/daemon.json
{
  "insecure-registries": ["192.168.x.x:5000"]
}
```

設定後、Docker daemon を再起動:
```bash
sudo systemctl restart docker
```

---

## セキュリティ考慮事項

| 項目 | 対策 |
|------|------|
| **ネットワーク** | ビルド PC ⇔ デプロイ PC 間は LAN 内に限定 |
| **認証** | 必要に応じてレジストリに Basic 認証を設定 |
| **HTTPS** | 本番運用では TLS 証明書を設定推奨 |
| **ファイアウォール** | レジストリポート(5000)へのアクセスを制限 |

---

## 運用フロー

```
1. [ビルドPC] ソースコード更新 (git pull)
2. [ビルドPC] docker build & push (build-and-push.sh)
3. [デプロイPC] docker pull (pull-and-deploy.sh)
4. [デプロイPC] Blue/Green 切り替え (switch-node.sh --no-build)
5. [デプロイPC] 動作確認 (status.sh)
6. [デプロイPC] 問題があれば旧ノードに切り戻し
```

---

## 必要な修正: switch-node.sh

現在の `switch-node.sh` は Step 2 と Step 4 で `docker compose build` を実行しています。
レジストリ方式に対応するため、`--no-build` オプションを追加する修正が必要です。

### 修正内容

| 項目 | 変更内容 |
|------|----------|
| **オプション追加** | `--no-build` オプションを受け付けるよう引数解析を追加 |
| **Step 2** | `--no-build` 時は `compose_app build` をスキップ |
| **Step 4** | `--no-build` 時は `compose_migrate build` をスキップ |
| **互換性** | オプションなしの場合は従来通りビルドを実行（後方互換） |

### 使用方法

```bash
# 従来方式（ローカルビルド）
./ops/switch-node.sh blue

# レジストリ方式（ビルドスキップ）
./ops/switch-node.sh blue --no-build
```

### 修正対象箇所

[ops/switch-node.sh](ops/switch-node.sh) の以下の行:

```bash
# Step 2: この行を --no-build 時にスキップ
compose_app "$target" build "pecusapi-$target" "frontend-$target" "backfire-$target"

# Step 4: この行を --no-build 時にスキップ
compose_migrate build dbmanager
```

---

## 関連ドキュメント

- [DEPLOY_OVERVIEW.md](DEPLOY_OVERVIEW.md) - デプロイ全体概要
- [ops/switch-node.sh](ops/switch-node.sh) - Blue/Green 切り替えスクリプト
- [ops/status.sh](ops/status.sh) - 稼働状況確認

---

## 今後の拡張案

- **CI/CD 連携**: GitHub Actions / GitLab CI からビルド PC へのトリガー
- **複数デプロイ PC 対応**: ステージング/本番で同一レジストリを共有
- **イメージクリーンアップ**: 古いタグの自動削除ポリシー

---

*最終更新: 2026-01-08*
