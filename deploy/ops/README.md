# deploy/ops

人が手動で叩く前提の運用スクリプトです（blue/green 切替など）。

## 事前準備

- 破壊的操作は `yes/no` 確認が必要です（デフォルト no）
- 実行は `sh xxx.sh` または `./xxx.sh` どちらでも可（bash にフォールバックします）

## スクリプト一覧

### インフラ起動/終了

```
sh infra-up.sh
sh infra-up.sh --no-build   # ビルドせずに起動
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
sh db-reset-migrate.sh
```

`yes` 入力で実行。非対話で実行する場合:

```
sh db-reset-migrate.sh -y
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

現在稼働中の DB と Docker イメージをセットでスナップショットとして保存します（1世代のみ保持）。

- 保存先: `${DATA_PATH}/snapshot/`
- 処理内容:
  1. 既存スナップショットを削除
  2. DBバックアップを実行
  3. 現在のアクティブスロットのイメージに `snapshot-latest` タグを付与
  4. メタデータ（作成日時、gitコミット、スロット情報）を保存

### スナップショットリストア（破壊的）

```
sh snapshot-restore.sh
```

スナップショットから DB とイメージを復元し、非アクティブスロットに展開します。

- 処理フロー:
  1. 非アクティブスロットを停止
  2. スナップショットイメージを復元
  3. DBリストア
  4. 非アクティブスロットを起動
  5. Nginx を切り替え
  6. 旧スロットを停止

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
