# 設定ファイル管理

## AI エージェント向け要約（必読）

- **唯一のソース**: `config/settings.base.json` — 全ての設定はここで管理
- **生成コマンド**: `node scripts/generate-appsettings.js`（開発用）、`-P` で本番用
- **生成ファイルは編集禁止**: `appsettings.json`, `.env.local`, `deploy/.env` は自動生成
- **設定変更時**: `settings.base.json` を編集 → `generate-appsettings.js` を実行
- **Aspire 環境**: ポート設定があれば固定、なければランダム割り当て

## 概要

本システムでは `config/settings.base.json` を**唯一の設定ソース**として管理し、開発環境と本番環境の乖離を最小化しています。

```
config/settings.base.json  ←── 唯一のソース
        │
        ▼
scripts/generate-appsettings.js
        │
        ├──► pecus.AppHost/appsettings.json     (Aspire 開発環境)
        ├──► pecus.WebApi/appsettings.json      (C# WebAPI)
        ├──► pecus.BackFire/appsettings.json    (C# Hangfire)
        ├──► pecus.DbManager/appsettings.json   (C# マイグレーション)
        ├──► pecus.Frontend/.env.local          (Next.js 開発環境)
        └──► deploy/.env                        (Docker Compose 本番、-P 時のみ)
```

## 使い方

```bash
# 開発用の設定ファイルを生成
node scripts/generate-appsettings.js

# 本番用（deploy/.env も生成）
node scripts/generate-appsettings.js -P
```

## 設定ファイルの構造

```json
{
  "_infrastructure": {
    "postgres": { "user": "pecus", "port": 5432, ... },
    "redis": { "port": 6379 },
    "ports": { "webapi": 7265, "frontend": 3000, "lexicalConverter": 5100, ... },
    "urls": {
      "frontend": "https://localhost:3000",
      "webapiPublic": "https://localhost:7265",
      "lexicalConverter": "http://localhost:5100"
    },
    "docker": { "postgresHost": "postgres", "lexicalConverterHost": "lexicalconverter", ... }
  },
  "_shared": {
    "LexicalConverter": { "GrpcApiKey": "..." },
    "Email": { ... },
    "DefaultAi": { ... }
  },
  "webapi": { ... },
  "backfire": { ... },
  "dbmanager": { ... }
}
```

| セクション | 用途 |
|-----------|------|
| `_infrastructure.ports` | Aspire/ローカル開発用のポート番号 |
| `_infrastructure.urls` | 各環境での完全な URL（本番は prod.json でオーバーライド） |
| `_infrastructure.docker` | Docker Compose 内部ホスト名（deploy/.env 生成時のフォールバック用） |
| `_shared` | 複数サービスで共有するアプリケーション設定（URL は含まない） |
| `webapi` / `backfire` / `dbmanager` | 各サービス固有の設定 |

**重要**: URL は `_infrastructure.urls` に集約し、`_shared` には API キーやタイムアウト等のアプリケーション設定のみを配置します。

## 環境別オーバーライド

```bash
# 開発用オーバーライド
node scripts/generate-appsettings.js -D
# → settings.base.json + settings.base.dev.json をマージ

# 本番用オーバーライド
node scripts/generate-appsettings.js -P
# → settings.base.json + settings.base.prod.json をマージ
```

## フロントエンドの環境変数

フロントエンドでは `src/libs/env.ts` が環境変数を統一的に取得します。

```typescript
import { getApiBaseUrl, getRedisConnectionString } from '@/libs/env';

const apiUrl = getApiBaseUrl();  // Aspire / Docker / フォールバック を自動判定
```

**優先順位:**
1. Aspire 環境変数（`services__pecusapi__https__0`）
2. Docker 環境変数（`PECUS_API_URL`）
3. フォールバック（`https://localhost:7265`）

## 注意事項

- 生成されるファイルは `.gitignore` で管理（手動編集禁止）
- 設定変更は必ず `config/settings.base.json` で行う
- 変更後は `node scripts/generate-appsettings.js` を実行

## Aspire 開発環境のポート動作

Aspire 環境では、`_infrastructure.postgres.port` や `_infrastructure.redis.port` の設定に応じて動作が変わります：

| 設定 | 動作 |
|------|------|
| ポート指定あり（例: `5432`） | 指定したポートで起動（ポート競合時はエラー） |
| ポート指定なし | Aspire がランダムポートを割り当て |

**推奨**: 開発環境ではランダムポートを許容し、ポート競合を回避する。他サービスへの接続は Aspire が自動注入する接続文字列を使用するため、ポート番号を意識する必要はない。
