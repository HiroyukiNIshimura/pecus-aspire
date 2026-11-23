# Coati deployment

現行の運用入口です。Blue/Green、ビルドPC分離、PostgreSQL・2系統Redisの構成は変更していません。

旧手順と旧スクリプトは履歴・比較用の `_deploy/` にあり、運用では使用しません。

## 公開コマンド

### 1. 通常リリース

ビルドPC:

```bash
cd deploy/build-pc
./release.sh
```

表示されたrelease IDをデプロイPCで使用します。

```bash
cd deploy/deploy-pc
./deploy.sh <release-id>
```

`latest` はデプロイ対象にできません。WebApi・Frontend・BackFire・DbManager・LexicalConverterの全5イメージが、同じGit revisionとrelease IDであることを検証してから切り替えます。

### 2. 初回環境構築

デプロイPCでrootとして設定します。

```bash
cd deploy/deploy-pc
sudo ./setup.sh
# .env が作成された場合は BUILD_PC_IP 等を編集して再実行
```

リリース作成後、DB未作成の新環境だけ次を実行します。

```bash
./deploy.sh <release-id> --initialize-db
```

`--initialize-db` は全アプリケーションスロットが停止している場合だけ実行できます。

デプロイ前にRedis永続ディレクトリが `CONTAINER_UID:CONTAINER_GID` を所有し、
再帰的に既存AOFファイルも書き換え可能か検証します。権限不一致時は
`sudo ./setup.sh` を実行してから再デプロイしてください。

### 3. 障害時の停止

```bash
cd deploy/ops
./coati stop app   # WebApi/Frontend/BackFire の両スロットを停止
./coati stop all   # アプリ、監視、インフラを順に停止
```

通常の停止はDB・Redisデータを削除しません。

## 状態確認と復旧

```bash
./coati status
./coati inspect blue
./coati logs active --tail=200
./coati smoke
./coati backup
./rollback.sh <previous-release-id>
```

ロールバックはDBマイグレーションを元に戻しません。Expand/Contract非互換な変更はロールバック前提で配布しないでください。

## リリース順序

1. 全イメージと実行設定を同じreleaseとして作成
2. 全5サービスのpush完了
3. manifestと各OCIラベルを検証
4. `latest` を最後に更新
5. デプロイPCでmanifestとdigestを再検証し、保護された設定スナップショットを取得
6. DbManagerマイグレーション
7. 非アクティブスロット起動・内部スモークテスト
8. BackFireを切替
9. Nginxを切替
10. 公開Nginx経路を検証
11. release状態を確定
12. 旧WebApi/Frontendをロールバック用に保持

通常デプロイではイメージ削除やbuilder cache削除を行いません。
デプロイとrollbackはホスト単位で排他し、失敗時は設定、対象slotタグ、
LexicalConverter、Prometheus target、Nginx向き先、BackFireを可能な範囲で復元します。

## 非破壊検証

```bash
sh tests/check-scripts.sh
```

ShellCheck、POSIX shell構文、スモークテストのステータス解析、health遷移、
デプロイロック競合を検証します。
