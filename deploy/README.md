# Pecus Aspire - 本番デプロイガイド

## 概要

このディレクトリには、Pecus Aspire（Coati）を本番環境にデプロイするための Docker Compose 構成が含まれています。

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

## クイックスタート

### 1. 設定ファイルの準備

```bash
cd /path/to/pecus-aspire

# 本番用オーバーライドファイルを作成
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
# 本番用設定を生成
node scripts/generate-appsettings.js -P

# または環境変数で上書きしながら生成
POSTGRES_PASSWORD=xxx AI_API_KEY=xxx node scripts/generate-appsettings.js -P
```

### 3. 環境変数の設定（Docker Compose 用）

```bash
cd deploy
cp .env.example .env
```

`.env` ファイルを編集:

```bash
# 必須設定（settings.base.prod.json と同じ値を設定）
POSTGRES_PASSWORD=secure_postgres_password
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

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

# イメージを再ビルドしてデプロイ
sh deploy.sh --rebuild

# 設定生成のみ（デプロイしない）
sh deploy.sh --generate-only
```

**方法2: 手動で実行**

```bash
# 設定生成
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

```nginx
upstream frontend {
    server localhost:3000;
}

upstream api {
    server localhost:7265;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://api/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SignalR WebSocket
    location /hubs/ {
        proxy_pass http://api/hubs/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
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

### API ヘルスチェックが失敗する

```bash
# コンテナ内から確認
docker compose exec pecusapi curl http://localhost:8080/health

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
- 本番環境では強力なパスワードを使用する
- HTTPS を必ず使用する (リバースプロキシで設定)
- データベースのバックアップを定期的に取得する
- Redis にはパスワードを設定することを推奨

## ファイル構成

```
pecus-aspire/
├── config/
│   ├── settings.base.json           # ベース設定 (Git管理)
│   ├── settings.base.dev.json       # 開発用オーバーライド (.gitignore)
│   ├── settings.base.prod.json      # 本番用オーバーライド (.gitignore)
│   └── settings.base.prod.json.example  # 本番用テンプレート
├── scripts/
│   └── generate-appsettings.js      # 設定生成スクリプト
└── deploy/
    ├── deploy.sh                    # 本番デプロイスクリプト
    ├── docker-compose.yml           # メイン Compose ファイル
    ├── .env.example                 # 環境変数テンプレート
    ├── README.md                    # このファイル
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
          # 本番用オーバーライドファイルを作成
          echo '${{ secrets.SETTINGS_BASE_PROD_JSON }}' > config/settings.base.prod.json
          # または環境変数で上書き
          node scripts/generate-appsettings.js -P

      - name: Build and push
        run: docker compose -f deploy/docker-compose.yml build
```
