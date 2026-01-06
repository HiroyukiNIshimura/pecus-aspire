# deploy ディレクトリ構成・運用ドキュメント

## 概要
このディレクトリは「Coati (Pecus Aspire)」の本番/検証環境向けインフラ・アプリケーションのデプロイ、運用自動化、監視、バックアップ、Blue/Greenデプロイ切替などを担う仕組み一式を管理します。

---

## 主要構成

### 1. docker-compose.*.yml
- **docker-compose.infra.yml**: DB(PostgreSQL+PGroonga), Redis, LexicalConverter, Nginx等のインフラ基盤を定義。
- **docker-compose.app-blue.yml / app-green.yml**: Blue/GreenスロットごとのWebAPI/Frontend/BackFireサービス定義。
- **docker-compose.backup.yml**: PostgreSQLバックアップ用サービス定義。
- **docker-compose.restore-helper.yml**: PostgreSQLリストア用ヘルパーサービス。
- **docker-compose.migrate.yml**: DBマイグレーション/シード用サービス。
- **docker-compose.monitoring.yml**: Prometheus等の監視基盤スタック。

### 2. dockerfiles/
- 各サービス（WebApi, Frontend, BackFire, DbManager, LexicalConverter）用のDockerfile群。

### 3. ops/
- 運用スクリプト群。Blue/Green切替、infra/app層の起動・停止、バックアップ/リストア、スナップショット、監視、クリーンアップ等を自動化。
- 代表的なスクリプト:
  - `infra-up.sh` / `infra-down.sh`: インフラ層の起動・停止
  - `app-down.sh`: アプリ層(blue/green)の停止
  - `switch-node.sh`: Blue/Green切替デプロイ
  - `pg-backup.sh` / `pg-restore.sh`: DBバックアップ/リストア
  - `snapshot-create.sh` / `snapshot-restore.sh`: Dockerイメージのスナップショット/ロールバック
  - `cleanup.sh`: 不要リソースのクリーンアップ
  - `status.sh`: 稼働状況の一覧表示
  - `monitoring-up.sh` / `monitoring-down.sh`: 監視基盤の起動・停止
  - `update-prometheus-targets.sh`: Prometheus監視ターゲットの自動生成

### 4. nginx/・proxy-nginx/
- **nginx/**: 内部向けNginx設定（Blue/Green切替専用、外部公開しない）
- **proxy-nginx/**: 外部公開用Nginx設定（TLS終端、内部nginxへのリバースプロキシ）

---

## Blue/Greenデプロイ運用フロー（概要）
1. `infra-up.sh` でインフラ層起動
2. `switch-node.sh blue|green` で新バージョンをデプロイ
3. `status.sh` で稼働状況確認
4. 必要に応じ `snapshot-create.sh` でイメージ退避
5. 切替後、`infra-down.sh`/`app-down.sh` で不要な層を停止

---

## 監視・バックアップ
- Prometheus構成・ターゲットは `ops/prometheus/` 配下で管理し、`update-prometheus-targets.sh` で自動生成
- DBバックアップ/リストアは `pg-backup.sh`/`pg-restore.sh` で自動化

---

## 注意事項
- `.env`/`.env.example` で環境変数を管理。未生成時は `scripts/generate-appsettings.js` で自動生成
- Blue/Green切替・運用は必ず `ops/` スクリプト経由で実施（手動docker compose操作は非推奨）
- 詳細は各スクリプト・composeファイルのコメント参照

---

## 参考: 主要スクリプト・ファイル一覧
- `ops/infra-up.sh` ... インフラ層起動
- `ops/infra-down.sh` ... インフラ層停止
- `ops/app-down.sh` ... アプリ層停止
- `ops/switch-node.sh` ... Blue/Green切替
- `ops/pg-backup.sh` ... DBバックアップ
- `ops/pg-restore.sh` ... DBリストア
- `ops/snapshot-create.sh` ... イメージスナップショット
- `ops/snapshot-restore.sh` ... イメージロールバック
- `ops/cleanup.sh` ... リソースクリーンアップ
- `ops/status.sh` ... 稼働状況表示
- `ops/monitoring-up.sh` ... 監視基盤起動
- `ops/monitoring-down.sh` ... 監視基盤停止
- `ops/update-prometheus-targets.sh` ... 監視ターゲット生成

---

このドキュメントは自動生成です。詳細な運用手順や設計意図は各スクリプト・composeファイルのコメントも参照してください。
