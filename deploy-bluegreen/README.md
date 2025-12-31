# deploy-bluegreen

このディレクトリは、既存の `deploy/` とは別に、**Blue/Green + Expand/Contract** を前提にした本番運用案を試作するための構成です。

- インフラ（DB/Redis/Lexical/Nginx）は常駐
- アプリは `blue` / `green` の2スロットで並行起動
- Nginx は `nginx/conf.d/00-active-slot.conf` の **default を切り替えるだけ**
- DB は **Expand/Contract（後方互換）** を運用ルールとして固定

> 注意: この構成は "運用ルール + 実行手順" を含む試作です。実運用に入れる前に、TLS終端・証明書更新・監視/ログ・リソース制限などは別途整備してください。

## 目的

- **アプリの切替**を Nginx の reload だけにする（高速・安全）
- リリース失敗時に「DBを戻さずに」 traffic を元のスロットに戻せるよう、DB変更を **後方互換**に縛る

## ファイル構成

- `docker-compose.infra.yml`
  - postgres / redis / redis-frontend / lexicalconverter / nginx
- `docker-compose.migrate.yml`
  - dbmanager（マイグレーション/シード）を **手動で実行**するための compose
- `docker-compose.app-blue.yml`
  - pecusapi-blue / frontend-blue / backfire-blue
- `docker-compose.app-green.yml`
  - pecusapi-green / frontend-green / backfire-green
- `nginx/conf.d/00-active-slot.conf`
  - **切替ポイント**（default blue/green）
- `nginx/conf.d/10-coati.conf`
  - ルーティング（/backend, /api, /）
- `scripts/switch-slot.sh`
  - active slot の変更 + nginx reload
- `scripts/smoke-test.sh`
  - nginx コンテナ内から blue/green の到達性を簡易確認

## セットアップ

### 1) env

このディレクトリ直下に `.env` を用意します。

- 例: `cp .env.example .env`
- もしくは既存の `deploy/.env`（自動生成）を流用してもOK（手動でコピー推奨）

必須:

- `DATA_PATH`
- `POSTGRES_PASSWORD`

### 2) 起動

```bash
cd deploy-bluegreen

# infra 起動
docker compose -f docker-compose.infra.yml up -d --build

# 初回は DB migrate（後述）
docker compose -f docker-compose.infra.yml -f docker-compose.migrate.yml run --rm dbmanager

# blue 起動（backfire も blue のみ起動）
docker compose -f docker-compose.infra.yml -f docker-compose.app-blue.yml up -d --build
```

## Blue/Green 切替（DBは戻さない）

### green をデプロイして確認

```bash
cd deploy-bluegreen

# 先に DB の Expand を適用（Expand/Contract の Expand）
docker compose -f docker-compose.infra.yml -f docker-compose.migrate.yml run --rm dbmanager

# green を起動（backfire は green も起動するなら、切替後に）
docker compose -f docker-compose.infra.yml -f docker-compose.app-green.yml up -d --build pecusapi-green frontend-green

# 内部到達性チェック
./scripts/smoke-test.sh
```

### traffic を green に切替

```bash
cd deploy-bluegreen
./scripts/switch-slot.sh green
```

### 切替後に backfire を green に移す（推奨）

Hangfire は二重起動するとジョブの実行が増える（=事故る）ので、**常に片系のみ**にします。

```bash
cd deploy-bluegreen

# green の backfire を起動
docker compose -f docker-compose.infra.yml -f docker-compose.app-green.yml up -d --build backfire-green

# blue の backfire を停止
docker compose -f docker-compose.infra.yml -f docker-compose.app-blue.yml stop backfire-blue
```

### 旧スロット停止

```bash
cd deploy-bluegreen

docker compose -f docker-compose.infra.yml -f docker-compose.app-blue.yml down
```

## Expand/Contract 運用ルール（実装）

### なぜ必要か

Blue/Green で "切替だけ" を安全にやるには、**新旧どちらのアプリも同じDBで動く**必要があります。
そのため、DB変更は次の2段階に分けます:

- **Expand（拡張）**: 追加・互換（旧アプリが壊れない）
- **Contract（収縮）**: 不要になったものを削除（全台新アプリ移行後）

> 重要: 「失敗したらマイグレーションを戻す」は、データ破壊やダウンタイム無しでは成立しにくいです。
> ここでは **DBは前進のみ** を原則にし、ロールバックは **traffic 切替**で行います。

### Expand のルール

OK:

- nullable 列の追加
- 新テーブル追加
- 新インデックス追加
- 既存カラムの意味を変えないビュー追加

NG（Expand では禁止）:

- NOT NULL 追加（デフォルト無し）
- 既存列の型変更（互換性が崩れる可能性が高い）
- 列/テーブルの削除
- 既存列のリネーム（古いコードが即死）

### アプリ側のルール

- Expand 直後は **旧アプリも動く**ようにコードを書く
- 新旧両対応が必要な期間は、読み取りは「新→旧フォールバック」、書き込みは「両方書く」などの手当をする
- Contract は別リリースで行う

### Contract のルール

- 全台（WebApi/Frontend/BackFire）が新バージョンで安定稼働していること
- 互換期間（例: 1週間）を超えていること
- バックアップ/復旧手順が確認できていること

### DB マイグレーション実行単位

- Expand/Contract の実行は `docker-compose.migrate.yml` の `dbmanager` を **都度 run** する

```bash
cd deploy-bluegreen

# Expand
DB_RESET_MODE=false docker compose -f docker-compose.infra.yml -f docker-compose.migrate.yml run --rm dbmanager

# Contract（実態は「Contract を含む新リリースの dbmanager を実行する」）
DB_RESET_MODE=false docker compose -f docker-compose.infra.yml -f docker-compose.migrate.yml run --rm dbmanager
```

## todo

- TLS終端（443）を nginx コンテナで行う場合は、証明書の mount と更新方式（certbot/外部ALB等）を決める
- 監視（/health の外形監視、コンテナ再起動、ログ収集）
- イメージのタグ運用（git sha / semver）
