明日の作業を依頼する際は、以下のように言うのがよいでしょう：

推奨表現
「フロントエンドの Server Actions 型安全化の続きをお願いします」

または、より具体的に：

「actions の残り全ファイルについて、ApiResponse<any> を具体的な生成型に置き換える作業をお願いします」

背景となるコンテキスト
✅ 完了: organization.ts, profile.ts, master.ts, auth.ts, admin/tags.ts, admin/workspace.ts, user.ts の 7ファイル
⏳ 残り: 他の actions/ 配下のファイル（例: actions/workspace.ts, actions/skills.ts など）で同様の修正が必要

チェックリスト形式で伝える方法
【完了】
✅ ConflictDataTypes.ts の修正
✅ PecusApiClient.ts の Axios エラー処理修正
✅ 以下 7 ファイルの Server Actions 型安全化完了：
  - organization.ts
  - profile.ts
  - master.ts
  - auth.ts
  - admin/tags.ts
  - admin/workspace.ts
  - admin/user.ts
✅ TypeScript ビルド成功

【明日】
⏳ 他の actions/ 配下ファイルについて同じ修正を実施してください