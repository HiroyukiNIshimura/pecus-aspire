# 設定ファイル管理

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
    "ports": { "webapi": 7265, "frontend": 3000, ... },
    "urls": { "frontend": "https://localhost:3000", ... }
  },
  "_shared": {
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
| `_infrastructure` | インフラ設定（DB、Redis、ポート、URL） |
| `_shared` | 複数サービスで共有する設定 |
| `webapi` / `backfire` / `dbmanager` | 各サービス固有の設定 |

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
