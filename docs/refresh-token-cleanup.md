# Refresh Token 運用ガイド

このプロジェクトではリフレッシュトークンを Redis（高速検証）と PostgreSQL（永続化・監査）の両方で管理します。

主な対策

- 1ユーザーあたりの有効リフレッシュトークン数をデフォルトで5つに制限（古いトークンを自動で失効）
- 期限切れ・無効化済みトークンをバッチで削除する Hangfire タスクを追加
- Redis と PostgreSQL の両方をクリーンアップ

実装箇所

- `pecus.WebApi/Services/RefreshTokenService.cs`
  - CreateRefreshTokenAsync: トークン発行時に同一ユーザーの古いトークンを自動失効するロジックを追加
- `pecus.Libs/Hangfire/Tasks/RefreshTokenCleanupTasks.cs`
  - CleanupExpiredTokensAsync: バッチ削除ロジックを実装
- `pecus.WebApi/AppHost.cs`
  - DI 登録と日次の定期ジョブ登録（Hangfire）の追加

運用・実行

- 日次で自動実行（Hangfire RecurringJob: `cleanup-refresh-tokens`）
- 手動実行（APIまたは直接 Hangfire ダッシュボードから）

Hangfire ダッシュボードでの手動実行

1. WebAPI を起動して `/hangfire` ダッシュボードにアクセス
2. `cleanup-refresh-tokens` ジョブを見つけて実行

ローカルでの手動実行（開発）

次のようなコマンドを実行して、アプリケーションの DI コンテナを使ってタスクを直接呼び出せます（PowerShell 例）:

```powershell
# 1. dotnet run --project pecus.WebApi
# 2. 別プロセスでスクリプトを実行するなどして CleanupExpiredTokensAsync を呼び出す
```

マイグレーション

今回の変更は既存の `RefreshToken` エンティティに影響を与えないため、マイグレーションは不要です。
将来的にカラムを追加する場合は `pecus.DbManager` プロジェクトで `dotnet ef migrations add <Name>` を作成してください。

設定項目の提案

- 最大トークン数: 環境変数や設定から制御できると便利（現在はコード内定数 `_maxTokensPerUser` = 5）
- 保持期間: 無効化済みトークンを削除するまでの日数（現在デフォルト: 30日）

ご要望があれば、これらを `PecusConfig` に切り出して環境変数で制御できるようにします。
