* ワークスペースへのメンバー追加・変更用のコンポーネント作成
* 管理者用ワークスペース編集画面にメンバー追加・変更機能
* 管理者用ワークスペース新規作成ページ
* ワークスペースアイテムのPIN機能→マイアイテムへの表示
* ワークスペースアイテムのタスク機能→タスクへの表示
* アクティビティの実装（要設計）

---

おやすみなさい！🌙

明日確認する際のポイントをまとめておきます：

確認事項
バックエンド: dotnet build pecus.sln でビルドが通ることを確認
フロントエンド: npx tsc --noEmit で型エラーがないことを確認
動作確認: dotnet run --project pecus.AppHost でアプリを起動し、ワークスペース関連のAPIが正常に動作することを確認
変更サマリ
Workspace DTOs（整理済み）
13ファイル → 8ファイルに削減
継承階層を廃止し、各DTOを独立化
WorkspaceUserItemを新規作成（一覧用軽量DTO）
User DTOs（整理済み）
UserResponse → UserDetailResponse にリネーム
UserListItemResponse → UserItem にリネーム
フロントエンド（型更新済み）
APIクライアント再生成済み
使用箇所の型名を更新済み
ConflictLatestDataの整合性を修正済み
何か問題があれば、明日お知らせください。ゆっくり休んでください！