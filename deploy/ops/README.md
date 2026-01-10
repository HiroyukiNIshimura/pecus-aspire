# deploy/ops

人が手動で叩く前提の運用スクリプトです（blue/green 切替など）。

## 事前準備

- 破壊的操作は `yes/no` 確認が必要です（デフォルト no）
- 実行は `sh xxx.sh` または `./xxx.sh` どちらでも可（bash にフォールバックします）

## スクリプト一覧

### インフラ起動/終了

```
sh infra-up.sh              # レジストリのイメージを使用（デフォルト）
sh infra-up.sh --build      # ローカルでビルド
sh infra-down.sh
```

### 監視基盤起動/停止

```
sh monitoring-up.sh
sh monitoring-down.sh
```

監視基盤（Prometheus / Exporters）のみを起動・停止します。
`infra-up.sh` はインフラのみを起動します。監視基盤も合わせて起動したい場合は、別途 `sh monitoring-up.sh` を実行してください。

### アプリ層停止

```
sh app-down.sh
sh app-down.sh -y   # 確認スキップ
```

稼働中のアクティブスロットのアプリ層（WebApi/Frontend/BackFire）のみを停止します。infra は停止しません。

### ノード切替（blue/green）

```
sh switch-node.sh blue
sh switch-node.sh green
```

- 指定した slot のコンテナが既に動いている場合はエラー（意図しない再デプロイ防止）
- 処理フロー:
  1. infra のヘルスチェック
  2. ターゲットの WebApi/Frontend を起動
  3. 旧スロットの WebApi/Frontend/BackFire を停止・削除
  4. DBマイグレーション実行
  5. ターゲットの BackFire を起動
  6. Nginx を切り替え

### 状態確認

```
sh status.sh
```

出力例:
```
アクティブスロット=blue

--- infra ---
  pecus-postgres                 running (healthy)
  pecus-redis                    running (healthy)
  pecus-redis-frontend           running (healthy)
  pecus-lexicalconverter         running (healthy)
  pecus-nginx                    running (-)

--- app-blue ---
  pecus-webapi-blue              running (healthy)
  pecus-frontend-blue            running (-)
  pecus-backfire-blue            running (-)

--- app-green ---
  pecus-webapi-green             stopped
  pecus-frontend-green           stopped
  pecus-backfire-green           stopped
```

### ログ確認

```
sh logs.sh active -f --tail=200
sh logs.sh blue --since=10m
sh logs.sh green
```

第1引数は `active` / `blue` / `green`。以降は `docker compose logs` のオプションをそのまま渡せます。

### DB リセット + マイグレーション（破壊的）

```
sh db-reset-migrate.sh              # レジストリのイメージを使用（デフォルト）
sh db-reset-migrate.sh --build      # ローカルでビルド
```

`yes` 入力で実行。非対話で実行する場合:

```
sh db-reset-migrate.sh -y
sh db-reset-migrate.sh -y --build   # ローカルビルド + 確認スキップ
```

### バックアップ

```
sh pg-backup.sh
```

バックアップ先: `${DATA_PATH}/backups/postgres/`

### リストア（破壊的）

```
CONFIRM_RESTORE=YES sh pg-restore.sh /path/to/pecusdb_YYYYMMDD.dump
```

パスはホスト側の絶対パスを指定。例:

```
CONFIRM_RESTORE=YES sh pg-restore.sh /var/docker/coati/data/backups/postgres/pecusdb_20260101T061046Z.dump
```

### スナップショット作成

```
sh snapshot-create.sh
```

現在稼働中の Docker イメージをスナップショットとして保存します。

- 対象イメージ: `coati-webapi`, `coati-frontend`, `coati-backfire`, `coati-dbmanager`
- 保存形式: `<service>:snapshot-YYYYMMDD-HHMMSS` および `<service>:snapshot-latest`
- 処理内容:
  1. 現在のアクティブスロットのイメージを検出
  2. ローカルビルド（`*:local`）またはレジストリ経由（`registry:5000/*`）どちらにも対応
  3. タイムスタンプ付きタグと `snapshot-latest` タグを作成

### スナップショットリストア（破壊的）

```
sh snapshot-restore.sh              # snapshot-latest を復元
sh snapshot-restore.sh 20260110-123456   # 特定バージョンを復元
```

スナップショットからイメージを復元し、ローカルタグ（`*:local`）として展開します。

- 対象イメージ: `coati-webapi`, `coati-frontend`, `coati-backfire`, `coati-dbmanager`
- 処理内容:
  1. スナップショットイメージを確認
  2. 各イメージを `*-blue:local` / `*-green:local` にタグ付け（dbmanager は `*:local`）
  3. 復元後は `switch-node.sh <slot> --no-build` で起動

**復元後の起動例:**
```
sh snapshot-restore.sh
sh switch-node.sh blue --no-build
```

### クリーンアップ

```
sh cleanup.sh
sh cleanup.sh --prune-images
sh cleanup.sh --prune-images --prune-builder
```

`yes` 入力で実行。

### Prometheus ターゲット更新（内部用）

```
sh update-prometheus-targets.sh [slot]
```

Blue/Green 切り替え状況に合わせて Prometheus のターゲット設定（`ops/prometheus/targets/*.json`）を更新します。
通常は `infra-up.sh` / `monitoring-up.sh` / `switch-node.sh` から自動的に呼び出されるため、手動実行は不要です。

## トラブルシューティング

### infra が起動しない / switch-node.sh でエラー

```
sh status.sh
```

で各コンテナの状態を確認。`stopped` や `unhealthy` があれば:

```
sh infra-up.sh
```

### バックアップファイルのパスが分からない

```
grep DATA_PATH ../deploy/.env
```

で `DATA_PATH` を確認し、`${DATA_PATH}/backups/postgres/` 配下を指定。
