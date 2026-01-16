# DataPath 設定一元化リファクタリング計画

## 概要

`settings.base.json` の `FileUpload.StoragePath` 等のパス設定が複数箇所で重複定義されている問題を解消し、`_infrastructure.dataPath` を唯一のソースとして一元管理する。

---

## 現状の問題点

### 1. 同じパスが複数箇所で定義されている

```json
// config/settings.base.json
{
  "_infrastructure": { "dataPath": "../data" },           // ← ルートパス
  "webapi.Pecus.FileUpload.StoragePath": "../data/uploads",  // ← 重複！
  "dbmanager.FileUpload.StoragePath": "../data/uploads",     // ← 重複！
  "backfire.UploadsCleanup.UploadsBasePath": ""              // ← 空（Aspire経由で注入）
}
```

### 2. 本番環境との整合性が取りにくい

- 開発環境: `../data/uploads`
- 本番環境: `/var/docker/coati/data/uploads`（Docker Compose の環境変数経由）

同じ意味のパスを別々に管理しているため、設定ミスのリスクがある。

---

## 現在のパス参照箇所一覧

| ファイル | 設定名 | 現在の値 | 備考 |
|---------|--------|---------|------|
| `config/settings.base.json` | `_infrastructure.dataPath` | `../data` | ✅ これが正 |
| `config/settings.base.json` | `webapi.Pecus.FileUpload.StoragePath` | `../data/uploads` | ❌ 重複 |
| `config/settings.base.json` | `dbmanager.FileUpload.StoragePath` | `../data/uploads` | ❌ 重複 |
| `config/settings.base.json` | `backfire.UploadsCleanup.UploadsBasePath` | `""` (空) | Aspire/Docker で注入 |
| `pecus.AppHost/AppHost.cs` | 環境変数注入 | `dataPath + "uploads"` | ✅ 正しいパターン |
| `pecus.Libs/DB/Seed/Atoms/DemoAtoms.cs` | コード内結合 | `dataPath + "uploads"` | ✅ 正しいパターン |
| `deploy/docker-compose.app-blue.yml` | 環境変数 | `/app/data/uploads` | Docker 内部パス |

---

## 目標設計

### 1. `_infrastructure` にフォルダ名を定義

```json
{
  "_infrastructure": {
    "dataPath": "../data",
    "folders": {
      "uploads": "uploads",
      "logs": "logs",
      "notifications": "notifications"
    }
  }
}
```

### 2. 各プロジェクト設定から `StoragePath` を削除

`generate-appsettings.js` がパスを自動生成して注入する。

### 3. パス解決の責任分担

| 環境 | パス解決の責任 |
|------|---------------|
| **開発 (Aspire)** | `AppHost.cs` が `dataPath` + `folders.uploads` を結合して環境変数で注入 |
| **本番 (Docker)** | `docker-compose.yml` の環境変数で `/app/data/uploads` を直接指定 |
| **DbManager Seed** | 既存の `_infrastructure:dataPath` + `"uploads"` パターンを維持 |

---

## 影響範囲と修正対象

### Phase 1: 設定ファイル修正

| ファイル | 作業内容 |
|---------|---------|
| `config/settings.base.json` | `_infrastructure.folders` 追加、各プロジェクトの `StoragePath` 削除 |
| `config/settings.base.dev.json` | 必要に応じて更新 |
| `config/settings.base.prod.json.example` | 必要に応じて更新 |

### Phase 2: 生成スクリプト修正

| ファイル | 作業内容 |
|---------|---------|
| `scripts/generate-appsettings.js` | `dataPath` + `folders.xxx` の結合ロジック追加 |

### Phase 3: C# コード修正

| ファイル | 作業内容 |
|---------|---------|
| `pecus.WebApi/Models/Config/FileUploadSettings.cs` | `StoragePath` のデフォルト値を確認（環境変数上書き前提なら問題なし）|
| `pecus.AppHost/AppHost.cs` | `_infrastructure:folders:uploads` から読み取るよう変更（既に正しいパターン）|
| `pecus.Libs/DB/Seed/Atoms/DemoAtoms.cs` | 既に正しいパターン（`dataPath + "uploads"`）なので変更不要 |

### Phase 4: Docker 環境確認

| ファイル | 作業内容 |
|---------|---------|
| `deploy/docker-compose.app-blue.yml` | 変更不要（環境変数で直接パス指定しているため）|
| `deploy/docker-compose.app-green.yml` | 同上 |
| `deploy/docker-compose.migrate.yml` | 必要に応じて確認 |
| `deploy/.env.example` | 必要に応じてドキュメント更新 |

---

## 詳細な修正内容

### `config/settings.base.json` の変更

```diff
{
  "_infrastructure": {
    "_comment": "Docker/Aspire 共通のインフラ設定",
    "dataPath": "../data",
+   "folders": {
+     "_comment": "dataPath 配下のサブフォルダ名。実際のパスは各環境で生成される",
+     "uploads": "uploads",
+     "logs": "logs",
+     "notifications": "notifications"
+   },
    "postgres": { ... },
    ...
  },

  "webapi": {
    "Pecus": {
      "FileUpload": {
-       "StoragePath": "../data/uploads",
        "MaxFileSize": 5242880,
        ...
      }
    }
  },

  "backfire": {
    "UploadsCleanup": {
-     "UploadsBasePath": "",
      "TempRetentionHours": 24,
      ...
    }
  },

  "dbmanager": {
-   "FileUpload": {
-     "StoragePath": "../data/uploads"
-   },
    "BackOffice": { ... },
    ...
  }
}
```

### `scripts/generate-appsettings.js` の変更

```javascript
// パス結合ヘルパー関数を追加
function resolveDataPath(config, folderName) {
  const basePath = config._infrastructure.dataPath;
  const folder = config._infrastructure.folders?.[folderName] ?? folderName;
  return path.posix.join(basePath, folder);
}

// 生成時に各プロジェクトへ注入
// WebApi
webapiConfig.Pecus.FileUpload.StoragePath = resolveDataPath(config, 'uploads');

// BackFire
backfireConfig.UploadsCleanup.UploadsBasePath = resolveDataPath(config, 'uploads');

// DbManager
dbmanagerConfig.FileUpload = { StoragePath: resolveDataPath(config, 'uploads') };
```

### `pecus.AppHost/AppHost.cs` の確認

現在の実装は既に正しいパターン：

```csharp
var dataPathValue = infraConfig["dataPath"] ?? "../data";
var dataPathResolved = Path.GetFullPath(...);
var uploadsPath = Path.Combine(dataPathResolved, "uploads");

// 環境変数で各プロジェクトへ注入
.WithEnvironment("Pecus__FileUpload__StoragePath", uploadsPath);
.WithEnvironment("UploadsCleanup__UploadsBasePath", uploadsPath);
.WithEnvironment("FileUpload__StoragePath", uploadsPath);
```

→ **変更不要**（将来的に `folders:uploads` から読み取るよう変更可能だが必須ではない）

---

## Docker 本番環境との整合性

### 本番環境のパス構造

```
/var/docker/coati/
├── data/                    # DATA_PATH 環境変数で指定
│   ├── uploads/             # アップロードファイル
│   ├── postgres/            # PostgreSQL データ
│   ├── redis/               # Redis データ
│   ├── redis-frontend/      # Frontend Redis データ
│   ├── notifications/       # 通知ファイル
│   └── logs/                # ログファイル
│       ├── webapi-blue/
│       ├── backfire-blue/
│       └── ...
```

### Docker Compose での設定

```yaml
# deploy/docker-compose.app-blue.yml
environment:
  Pecus__FileUpload__StoragePath: /app/data/uploads  # コンテナ内パス
volumes:
  - ${DATA_PATH}/uploads:/app/data/uploads           # ホスト→コンテナマウント
```

**ポイント**: Docker 環境では `DATA_PATH` 環境変数がホスト側パスを指定し、コンテナ内部は `/app/data/uploads` 固定。`settings.base.json` の値は開発環境でのみ使用される。

---

## 実装手順チェックリスト

### 準備

- [ ] Git の作業ブランチを作成
- [ ] 現在の動作確認（開発環境でアップロードが正常動作することを確認）

### Phase 1: 設定ファイル

- [ ] `config/settings.base.json` に `_infrastructure.folders` を追加
- [ ] `webapi.Pecus.FileUpload.StoragePath` を削除
- [ ] `backfire.UploadsCleanup.UploadsBasePath` を削除
- [ ] `dbmanager.FileUpload` を削除

### Phase 2: 生成スクリプト

- [ ] `scripts/generate-appsettings.js` にパス結合ロジックを追加
- [ ] `npm run generate-appsettings -- -D` で生成テスト
- [ ] 生成された各 `appsettings.json` を確認

### Phase 3: 動作確認

- [ ] `dotnet build pecus.sln` が成功すること
- [ ] Aspire 開発環境でアップロードが正常動作すること
- [ ] DbManager の Seed でアバターコピーが正常動作すること
- [ ] BackFire の Uploads Cleanup ジョブが正常動作すること

### Phase 4: Docker 確認

- [ ] `docker-compose.app-blue.yml` の環境変数が正しいことを確認
- [ ] 本番環境相当の構成でテスト（オプション）

### 完了

- [ ] ドキュメント更新（`docs/data-directory-structure.md` など）
- [ ] PR 作成・レビュー

---

## 関連ファイルリスト

### 設定ファイル
- `config/settings.base.json`
- `config/settings.base.dev.json`
- `config/settings.base.prod.json.example`

### スクリプト
- `scripts/generate-appsettings.js`

### C# コード
- `pecus.AppHost/AppHost.cs`
- `pecus.WebApi/Models/Config/FileUploadSettings.cs`
- `pecus.WebApi/Services/FileUploadService.cs`
- `pecus.BackFire/Services/CleanupJobSettings.cs`
- `pecus.BackFire/Services/CleanupJobScheduler.cs`
- `pecus.Libs/DB/Seed/Atoms/DemoAtoms.cs`

### Docker
- `deploy/docker-compose.app-blue.yml`
- `deploy/docker-compose.app-green.yml`
- `deploy/docker-compose.migrate.yml`

### ドキュメント
- `docs/data-directory-structure.md`
- `docs/config-management.md`

---

## リスクと考慮事項

### 低リスク
- 開発環境では Aspire が環境変数で上書きするため、`settings.base.json` の値変更は影響しにくい

### 中リスク
- `generate-appsettings.js` の変更でパス生成ロジックにバグが入る可能性
- → テスト: 生成された `appsettings.json` を目視確認

### 注意点
- Docker 本番環境は環境変数で直接パスを指定しているため、`settings.base.json` の変更は本番に影響しない
- ただし、`settings.base.prod.json` を使って本番設定を生成する場合は注意が必要

---

## 作成日

2026-01-16

## ステータス

**計画中** - 実装開始前
