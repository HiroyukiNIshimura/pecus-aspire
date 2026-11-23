# Deploy PC

## 初回環境構築

```bash
cp .env.example .env
# BUILD_PC_IP 等を編集
sudo ./setup.sh
```

`.env` が未作成の場合、`setup.sh` の初回実行でテンプレートを作成して終了します。

セットアップは `coati` ユーザー、UID/GID、データディレクトリ、private registry接続だけを扱います。PostgreSQLデータは削除しません。

リリースに含まれる実行設定は、ビルドPCの `releases/<release-id>.env` からSSHで取得します。デプロイPCでNode.jsや設定生成は不要です。

## 通常デプロイ

```bash
./deploy.sh <release-id>
```

release manifestに存在しないバージョン、サービス不足、digest不一致、Git revision不一致は停止します。`latest` は使用できません。

## 新規DBを伴う初回デプロイ

```bash
./deploy.sh <release-id> --initialize-db
```

DBを削除するため、全アプリケーションスロットが停止している場合だけ実行できます。

## ロールバック

```bash
./rollback.sh                       # 候補一覧
./rollback.sh <previous-release-id>
```

候補一覧からrelease ID・revision・作成日時・コミットメッセージを確認し、
指定releaseの全イメージをpull・検証して非アクティブスロットへ切り戻します。DB migrationは自動ロールバックされません。
