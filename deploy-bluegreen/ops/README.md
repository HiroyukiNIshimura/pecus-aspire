# deploy-bluegreen/ops

人が手動で叩く前提の運用スクリプトです（blue/green 切替など）。

## 事前準備

- `deploy-bluegreen/.env` が無い場合、各スクリプト実行時に `scripts/generate-appsettings.js -P` を呼び出して生成します。
- DB リセット（破壊的）を伴う操作は確認入力が必要です。
- 実行は `./xxx.sh` を推奨です（`sh xxx.sh` で実行しても bash にフォールバックします）。

## よく使うコマンド

- インフラ起動/終了
  - `./infra-up.sh`
  - `./infra-down.sh`

- DB 初期化（drop & recreate 級）+ migrate
  - 対話実行: `./db-reset-migrate.sh`（実行時に `RESET-DB` の入力が必要）
  - 非対話実行: `./db-reset-migrate.sh RESET-DB`
  - 明示: `./db-reset-migrate.sh --confirm RESET-DB`

- ノード切替（blue/green）
  - `./switch-node.sh blue`
  - `./switch-node.sh green`

- 状態確認
  - `./status.sh`

- ログ（active/blue/green 指定可。後続は docker compose logs のオプションをそのまま渡します）
  - `./logs.sh active -f --tail=200`
  - `./logs.sh blue --since=10m`

- バックアップ/リストア
  - `./pg-backup.sh`
  - `CONFIRM_RESTORE=YES ./pg-restore.sh /abs/path/to/file.dump`

- 掃除（確認入力 `CLEANUP` 必須）
  - `./cleanup.sh`
  - `./cleanup.sh --prune-images --prune-builder`
