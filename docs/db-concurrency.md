## pecus.WebApi における DB 競合（楽観ロック）対応まとめ

このドキュメントは `pecus.WebApi` プロジェクトで採用しているデータベース競合（楽観的ロック）に関する設計方針と実装パターンをまとめたものです。

### 目的
- 複数クライアントによる同時更新でデータの上書きや不整合が発生するのを防ぐ
- クライアント/サーバ双方で競合検出と復旧（再取得・再試行）を容易にする

### 概要（採用方式）
- 楽観ロック（RowVersion/Timestamp）を利用
  - C# 側: `byte[]`（EF Core の `[Timestamp]`）
  - PostgreSQL 側: `bytea` カラム
  - JSON 送受信: Base64 文字列としてシリアライズされる（System.Text.Json の既定動作）
- サービス層で競合を検出すると `ConcurrencyException` を投げる
- コントローラー層で `ConcurrencyException` を受け取り HTTP 409 Conflict を返す

### 主要ファイル／箇所（実装例）
- サービス層
  - `pecus.WebApi/Services/UserService.cs`（`SetUserRolesAsync`、`SetUserSkillsAsync` など）
  - `pecus.WebApi/Services/WorkspaceItemTagService.cs`（`SetTagsToItemAsync`）
- コントローラー層
  - `pecus.WebApi/Controllers/Admin/AdminUserController.cs`（`SetUserRoles`, `SetUserSkills`）
  - `pecus.WebApi/Controllers/WorkspaceItemTagController.cs`（タグ関連）
- リクエスト DTO
  - `SetUserRolesRequest` / `SetUserSkillsRequest`：`UserRowVersion: byte[]?` を含む
  - `SetTagsToItemRequest`：`ItemRowVersion: byte[]?` を含む

### 実装パターン（サービス層）
1. 更新操作を行う前に、クライアントから送られた RowVersion（`byte[]`）が提供されているかを確認
2. 提供されている場合は DB の現在の `RowVersion` と比較する。差異があれば `ConcurrencyException` をスローする
   - 比較は null 安全に行う（例: `user.RowVersion == null || !user.RowVersion.SequenceEqual(clientRowVersion)` のように扱わないよう注意し、実装では「クライアントが RowVersion を送ってきた時だけ比較する」方針が採られている）
3. 更新処理はトランザクション内で実行して、複数テーブルにまたがる変更は原子的に行う
4. 成功時にエンティティの `UpdatedAt` / `UpdatedByUserId` 等の監査情報を更新する

（注）実装例の要点:
- `userRowVersion != null && (user.RowVersion == null || !user.RowVersion.SequenceEqual(userRowVersion))` → 不一致なら `ConcurrencyException`
- `skillIds` や `tagNames` は `null` を許容して「空リストで洗い替え」「指定なしは変更なし」などの挙動を選べるようにしている箇所があるため、API の設計に応じて扱いを統一してください。

### 実装パターン（コントローラー層）
1. サービス呼び出しの前にアクセス権や存在チェックを行う（`CanAccessUserAsync` など）
2. サービスから `ConcurrencyException` が投げられた場合、`TypedResults.Conflict(...)` を返して HTTP 409 をクライアントに通知する
3. OpenAPI/Swagger の注釈として `ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)` を付与する

### クライアント開発者向け注意事項
- 更新系リクエストには、最新の `RowVersion` を必ず含める（Base64 エンコードされた文字列を `byte[]` として送るAPI設計の場合は、送受信ライブラリが自動で扱います）
- 409 Conflict を受け取ったら:
  1. エンティティの最新データを再取得する（GET）
  2. 必要に応じてマージや再編集を行い、再度更新リクエストを送る
- RowVersion を送らずに更新を許す設計もあるが、その場合は最終書き込みが勝つ（上書き）ので注意

### 例: リクエスト JSON（RowVersion の扱い）
```json
{
  "skillIds": [1, 2, 5],
  "userRowVersion": "q3J5cHRv...Base64...="
}
```

### エラー／例外ハンドリング
- サービス層は `ConcurrencyException` を投げる。コントローラーはこれをキャッチして 409 を返す。エラーメッセージはユーザー向けにわかりやすくする。

### テストと検証
- 単体テスト: サービス層で RowVersion が不一致の時に `ConcurrencyException` が投げられるケースをカバー
- 結合テスト: 同一リソースを並列で更新するシナリオで 409 が返ること、再取得→再試行のフローが機能することを確認

### 実運用上の運用メモ
- RowVersion は DB 側で `bytea`（Postgres）として保存される。アプリ側で `byte[]` として扱われ、JSON シリアライズは Base64 になる。
- フロントエンド／API クライアントで RowVersion の扱いを統一しておく（自動シリアライズ／デシリアライズの仕組みを整える）

### 参照箇所（コードベース内）
- `pecus.WebApi/Services/UserService.cs`
- `pecus.WebApi/Services/WorkspaceItemTagService.cs`
- `pecus.WebApi/Controllers/Admin/AdminUserController.cs`
- `pecus.WebApi/Controllers/WorkspaceItemTagController.cs`
- DTO: `SetUserRolesRequest`, `SetUserSkillsRequest`, `SetTagsToItemRequest`

---

このドキュメントはプロジェクト内での実装方針と現状のコードパターンに基づいて作成しています。詳細な箇所（挙動の細かい違い、NULL の扱い等）を変更する場合は、該当サービス／コントローラーの実装を参照し、動作に合わせて更新してください。
