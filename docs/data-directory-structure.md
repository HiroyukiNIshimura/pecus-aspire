# 永続データディレクトリ構成

## AI エージェント向け要約（必読）

- 永続データは `data/` ディレクトリに配置（`.gitignore` 管理）
- 開発時: ソリューションルートの `data/`、本番時: `/mnt/pecus-data` など外部ストレージ
- パス設定は `appsettings.json` の `Parameters:dataBasePath` で一元管理
- コンテナ再起動でもデータが保持されるよう、外部ボリュームをマウントする設計

---

## 概要

このプロジェクトでは、アップロードファイルや運営通知ファイルなどの永続データを、コンテナ外の共有ディレクトリで管理します。これにより、開発環境と本番環境で一貫したデータ管理が可能になります。

## ディレクトリ構成

```
pecus-aspire/
├── data/                        ← 永続データのベースディレクトリ（.gitignore）
│   ├── uploads/                 ← アップロードファイル
│   │   └── {userId}/            ← ユーザー別サブディレクトリ
│   │       └── {fileId}.ext
│   └── notifications/           ← 運営通知ファイル
│       ├── maintenance.md   ← 未処理の通知
│       └── 202512231234_xxx.md  ← 処理済みの通知（タイムスタンプ付き）
├── pecus.AppHost/
├── pecus.BackFire/
│   └── Notifications/
│       └── maintenance.md       ← テンプレート（参照用、本番では使用しない）
└── ...
```

## 設定

### 開発環境（appsettings.json）

```json
{
  "Parameters": {
    "dataBasePath": "../data"
  }
}
```

### 本番環境（appsettings.Production.json または環境変数）

```json
{
  "Parameters": {
    "dataBasePath": "/mnt/pecus-data"
  }
}
```

または環境変数で:

```bash
Parameters__dataBasePath=/mnt/pecus-data
```

## 各サービスへのパス注入

`pecus.AppHost/AppHost.cs` で以下のように環境変数として各サービスに注入されます：

```csharp
// Folders 設定を読み込み、各フォルダの絶対パスを計算
var foldersConfig = builder.Configuration.GetSection("Folders");
var dataPaths = new Dictionary<string, string>();
foreach (var folder in foldersConfig.GetChildren())
{
    if (folder.Key.StartsWith("_")) continue;
    var folderPath = Path.Combine(dataBasePath, folder.Value ?? folder.Key);
    dataPaths[folder.Key] = folderPath;
}

// 各プロジェクトへの注入
foreach (var (key, path) in dataPaths)
{
    backfireBuilder = backfireBuilder.WithEnvironment($"DataPaths__{char.ToUpper(key[0])}{key[1..]}", path);
}
```

## 各ディレクトリの用途

### `data/uploads/`

| 項目 | 説明 |
|------|------|
| 用途 | ユーザーがアップロードした添付ファイル |
| 参照元 | `pecus.WebApi`, `pecus.BackFire`（クリーンアップジョブ）, `pecus.DbManager`（シード） |
| 環境変数 | `DataPaths__Uploads` |

### `data/notifications/`

| 項目 | 説明 |
|------|------|
| 用途 | 運営通知（メンテナンス告知等）の Markdown ファイル |
| 参照元 | `pecus.BackFire`（30分ごとのジョブ） |
| 環境変数 | `DataPaths__Notifications` |

## 運営通知ファイルの運用

### 新規通知を送信する場合

1. `pecus.BackFire/Notifications/maintenance.md` をテンプレートとしてコピー
2. `data/notifications/` に新しいファイルを配置（例: `security-update.md`）
3. `publishAt`, `category`, `subject`, 本文を編集
4. 30分ごとのジョブ実行で自動送信（または Hangfire ダッシュボードから手動実行）
5. 送信完了後、ファイルは `202512231234_security-update.md` 形式にリネーム

### ファイル形式

```markdown
---
publishAt: 2025-12-23
category: 定期メンテナンス
subject: システムメンテナンスのお知らせ
---

メンテナンス内容の本文...
```

### 処理済みファイルの自動追加項目

```yaml
processedAt: 2025-12-23T12:34:56Z  # 送信処理日時（UTC）
messageIds:                         # 送信されたメッセージID
  - 12345
  - 12346
```

## 本番デプロイ時の設定

### Docker Compose

```yaml
services:
  backfire:
    volumes:
      - pecus-data:/mnt/pecus-data

  webapi:
    volumes:
      - pecus-data:/mnt/pecus-data

volumes:
  pecus-data:
```

### Azure Container Apps

```yaml
volumes:
  - name: pecus-data-volume
    storageType: AzureFile
    storageName: pecusdata

containers:
  - name: backfire
    volumeMounts:
      - volumeName: pecus-data-volume
        mountPath: /mnt/pecus-data
```

## 注意事項

- `data/` ディレクトリは `.gitignore` に含まれるため、Git にはコミットされません
- 開発環境では `data/.gitkeep` のみがリポジトリに含まれます
- コンテナ再起動時にデータが失われないよう、本番環境では必ず永続ボリュームをマウントしてください
- `pecus.BackFire/Notifications/` 内のファイルはビルド時にコンテナにコピーされますが、実際の通知処理には使用されません（テンプレート参照用）
