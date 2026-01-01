# Pecus Aspire - ステージングデプロイガイド

## 概要

このディレクトリには、Pecus Aspire（Coati）をステージング環境にデプロイするための Docker Compose 構成が含まれています。
**重要**
ステージング環境は全て本番環境と同じ設定内容とすること。
設定変更に対する本番環境でのテストは禁止！

## 設定ファイルの役割分離

> **詳細は `docs/config-management.md` を参照してください。**

| ファイル | 用途 | 管理対象 |
|----------|------|----------|
| `config/settings.base.json` | 全設定の唯一のソース | Git管理 |
| `config/settings.base.prod.json` | ステージング用オーバーライド（シークレット） | **Git管理外** |
| `deploy/.env` | Docker/インフラ設定（**自動生成**） | **Git管理外** |

```
┌─────────────────────────────────────────────────────────────────┐
│ config/settings.base.prod.json （アプリ設定）                    │
│ - JWT シークレット、AI APIキー、メール認証                        │
│ - BackOffice パスワード、データベースシード                       │
│ - その他アプリケーションレベルの設定                              │
├─────────────────────────────────────────────────────────────────┤
│ deploy/.env （Docker/インフラ設定）                              │
│ - PostgreSQL ユーザー/パスワード（コンテナ起動用）               │
│ - ポート番号（API_PORT, FRONTEND_PORT）                          │
│ - 公開URL（FRONTEND_URL, NEXT_PUBLIC_API_URL）                   │
└─────────────────────────────────────────────────────────────────┘
```

## アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Web API      │
│   (Next.js)     │     │   (.NET 10)     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       ├──────────────────┐
         │                       │                  │
         ▼                       ▼                  ▼
┌─────────────────┐     ┌─────────────────┐ ┌──────────────────┐
│ Redis Frontend  │     │     Redis       │ │   PostgreSQL     │
│   (Session)     │     │ (Cache/Session) │ │   (PGroonga)     │
└─────────────────┘     └─────────────────┘ └──────────────────┘
                                 │                  │
                                 ▼                  │
                        ┌─────────────────┐         │
                        │    BackFire     │─────────┘
                        │   (Hangfire)    │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ LexicalConverter│
                        │    (gRPC)       │
                        └─────────────────┘
```

## サービス一覧

| サービス | 説明 | ポート |
|----------|------|--------|
| `postgres` | PostgreSQL + PGroonga (全文検索) | 5432 (内部) |
| `redis` | バックエンド用 Redis | 6379 (内部) |
| `redis-frontend` | フロントエンド用 Redis (セッション) | 6379 (内部) |
| `lexicalconverter` | Lexical JSON 変換 gRPC サービス | 5100 (内部) |
| `dbmanager` | DB マイグレーション & シード | - |
| `backfire` | Hangfire バックグラウンドジョブ | 8080 (内部) |
| `pecusapi` | .NET Web API | 7265 (外部) |
| `frontend` | Next.js フロントエンド | 3000 (外部) |

## nginx ルーティング設計

nginx リバースプロキシでは以下のルーティングを使用します:

| パス | 転送先 | 説明 |
|------|--------|------|
| `/backend/hubs/*` | pecusapi (WebSocket) | SignalR Hub |
| `/backend/*` | pecusapi | .NET WebAPI |
| `/api/*` | frontend | Next.js API Routes |
| `/*` | frontend | Next.js フロントエンド |

**設定ファイル**: `deploy/nginx/coati.conf`

この設計により、Next.js API Routes が増えても nginx 設定の変更は不要です。

## クイックスタート

### 1. 設定ファイルの準備

```bash
cd /path/to/pecus-aspire

# ステージング用オーバーライドファイルを作成
cp config/settings.base.prod.json.example config/settings.base.prod.json

# 設定を編集（シークレット等を設定）
vim config/settings.base.prod.json
```

**必須設定項目:**

```json
{
  "_parameters": {
    "password": "secure_postgres_password",
    "frontendUrl": "https://your-domain.com"
  },
  "_shared": {
    "Email": {
      "SmtpHost": "smtp.example.com",
      "Username": "your_smtp_user",
      "Password": "your_smtp_password",
      "FromEmail": "noreply@your-domain.com"
    },
    "DefaultAi": {
      "ApiKey": "your_ai_api_key"
    }
  },
  "webapi": {
    "Pecus": {
      "Jwt": {
        "IssuerSigningKey": "your_jwt_secret_at_least_32_chars",
        "ValidIssuer": "https://your-domain.com/",
        "ValidAudience": "https://your-domain.com/"
      }
    },
    "Security": {
      "AllowedFrontendUrls": ["https://your-domain.com"]
    }
  },
  "dbmanager": {
    "BackOffice": {
      "Users": [
        {
          "Password": "secure_backoffice_password"
        }
      ]
    }
  }
}
```

### 2. appsettings.json の生成

```bash
# ステージング用設定を生成
node scripts/generate-appsettings.js -P

# または環境変数で上書きしながら生成
POSTGRES_PASSWORD=xxx AI_API_KEY=xxx node scripts/generate-appsettings.js -P
```

### 3. 環境変数ファイルの生成

`deploy/.env` は **手動作成不要** です。ステップ2の `generate-appsettings.js -P` で自動生成されます。

生成される `.env` の内容（`config/settings.base.json` + `settings.base.prod.json` から抽出）:

```bash
# PostgreSQL
POSTGRES_USER=pecus
POSTGRES_PASSWORD=secure_postgres_password
POSTGRES_DB=pecusdb

# ポート番号
WEBAPI_PORT=7265
FRONTEND_PORT=3000

# 公開URL
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/backend

# Docker 内部ホスト/URL
LEXICAL_CONVERTER_URL=http://lexicalconverter:5100
REDIS_URL=redis://redis-frontend:6379
# ... 他
```

> **Note**: `.env` は `settings.base.json` の `_infrastructure` セクションから自動生成されます。
> 手動編集は不要です。ステージング用の値は `settings.base.prod.json` でオーバーライドしてください。

### 4. Next.js の設定確認

`pecus.Frontend/next.config.ts` に以下の設定が必要です:

```typescript
const nextConfig: NextConfig = {
  distDir: 'build',
  output: 'standalone',  // ← これが必要
  // ...
};
```

### 5. ビルドと起動

**方法1: デプロイスクリプトを使用（推奨）**

```bash
cd deploy

# 通常デプロイ（設定生成 → 起動）
sh deploy.sh

# イメージを再ビルドしてデプロイ（git pull も実行）
sh deploy.sh --rebuild

# 設定生成のみ（デプロイしない）
sh deploy.sh --generate-only

# DBを完全に初期化してデプロイ（⚠️ すべてのデータが削除されます）
sh deploy.sh --reset-db
```

**方法2: 手動で実行**

```bash
# 設定生成（appsettings.json + deploy/.env を生成）
node scripts/generate-appsettings.js -P

# イメージのビルドと起動
cd deploy
docker compose up -d --build

# ログの確認
docker compose logs -f

# 特定サービスのログ
docker compose logs -f pecusapi
```

### 6. 起動順序

Docker Compose は以下の順序でサービスを起動します:

1. `postgres`, `redis`, `redis-frontend` (インフラ)
2. `lexicalconverter` (gRPC サービス)
3. `dbmanager` (マイグレーション実行後に終了)
4. `backfire` (バックグラウンドジョブ)
5. `pecusapi` (Web API)
6. `frontend` (Next.js)

## 運用コマンド

### サービス管理

```bash
# 全サービス停止
docker compose down

# データボリュームも含めて削除 (⚠️ 注意: データが消えます)
docker compose down -v

# 特定サービスの再起動
docker compose restart pecusapi

# サービスのスケール
docker compose up -d --scale pecusapi=3
```

### ログ確認

```bash
# 全サービスのログ
docker compose logs -f

# 特定サービスのログ
docker compose logs -f pecusapi backfire

# 最新100行のみ
docker compose logs --tail=100 pecusapi
```

### データベース

```bash
# PostgreSQL に接続
docker compose exec postgres psql -U pecus -d pecusdb

# バックアップ
docker compose exec postgres pg_dump -U pecus pecusdb > backup.sql

# リストア
cat backup.sql | docker compose exec -T postgres psql -U pecus pecusdb
```

## リバースプロキシ設定例

### Nginx

> **Note**: 完全な nginx 設定ファイルは `deploy/nginx/coati.conf` にあります。
> 以下は主要な設定の抜粋です。

```nginx
upstream coati {
    server 192.168.1.234:3000;  # Docker ホストの IP
}

upstream coati-api {
    server 192.168.1.234:7265;  # Docker ホストの IP
}

map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # SignalR Hub (WebSocket) - /api/ より前に配置
    location /api/hubs/ {
        proxy_pass http://coati-api/hubs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
    }

    # Frontend API Routes (Next.js) - アバター画像等
    location /api/images/ {
        proxy_pass http://coati;
    }

    # WebAPI (.NET)
    location /api/ {
        proxy_pass http://coati-api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400s;
    }

    # Frontend (Next.js)
    location / {
        proxy_pass http://coati;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

## トラブルシューティング

### dbmanager が失敗する

```bash
# ログ確認
docker compose logs dbmanager

# 再実行
docker compose up -d dbmanager
```

### DBを完全に初期化したい

ボリュームを削除せずにDBをリセットしたい場合は `--reset-db` オプションを使用:

```bash
sh deploy.sh --reset-db
```

これにより `DbInitializer` が `EnsureDeletedAsync()` を実行し、DBを再作成します。

### API ヘルスチェックが失敗する

```bash
# コンテナ内から確認
docker compose exec pecusapi curl http://localhost:7265/health

# ログ確認
docker compose logs pecusapi
```

### フロントエンドが API に接続できない

1. `PECUS_API_URL` 環境変数を確認
2. Docker ネットワーク内での名前解決を確認:

```bash
docker compose exec frontend ping pecusapi
```

## セキュリティ注意事項

- `.env` ファイルは **絶対に** Git にコミットしない
- ステージング環境では強力なパスワードを使用する
- HTTPS を必ず使用する (リバースプロキシで設定)
- データベースのバックアップを定期的に取得する
- Redis にはパスワードを設定することを推奨

## ファイル構成

```
pecus-aspire/
├── config/
│   ├── settings.base.json           # 唯一の設定ソース (Git管理)
│   ├── settings.base.dev.json       # 開発用オーバーライド (.gitignore)
│   ├── settings.base.prod.json      # ステージング用オーバーライド (.gitignore)
│   └── settings.base.prod.json.example  # ステージング用テンプレート
├── docs/
│   └── config-management.md         # 設定管理の詳細ドキュメント
├── scripts/
│   └── generate-appsettings.js      # 設定生成スクリプト
└── deploy/
    ├── deploy.sh                    # ステージングデプロイスクリプト
    ├── docker-compose.yml           # メイン Compose ファイル
    ├── .env                         # Docker 環境変数 (自動生成、.gitignore)
    ├── README.md                    # このファイル
    ├── nginx/
    │   └── coati.conf               # nginx リバースプロキシ設定
    └── dockerfiles/
        ├── WebApi.Dockerfile            # Web API
        ├── BackFire.Dockerfile          # Hangfire
        ├── DbManager.Dockerfile         # DB マイグレーション
        ├── LexicalConverter.Dockerfile  # gRPC サービス
        └── Frontend.Dockerfile          # Next.js
```

## CI/CD での設定生成例

### GitHub Actions

```yaml
jobs:
  deploy:
    steps:
      - uses: actions/checkout@v4

      - name: Generate appsettings
        env:
          POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
          AI_API_KEY: ${{ secrets.AI_API_KEY }}
          JWT_ISSUER_SIGNING_KEY: ${{ secrets.JWT_SECRET }}
          SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
        run: |
          # ステージング用オーバーライドファイルを作成
          echo '${{ secrets.SETTINGS_BASE_PROD_JSON }}' > config/settings.base.prod.json
          # または環境変数で上書き
          node scripts/generate-appsettings.js -P

      - name: Build and push
        run: docker compose -f deploy/docker-compose.yml build
```
