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

#### DbUpdateConcurrencyException の発生条件
- **発生する**: UPDATE 操作で WHERE RowVersion が不一致（0行更新）の場合 **のみ**
- **発生しない**: INSERT 操作（各レコード固有のため）、DELETE 操作（DELETE SQL に WHERE RowVersion 条件がないため）
- **結論**: DbUpdateConcurrencyException は **UPDATE 操作にのみ try-catch で対応** し、CREATE/DELETE には不要

#### 標準実装パターン（UPDATE 操作）

```csharp
// 前提: リクエストに RowVersion が存在する場合
try
{
    // ★ ステップ 1: 前置チェック（早期検出）
    if (!entity.RowVersion?.SequenceEqual(request.RowVersion) ?? true)
    {
        var latestEntity = await _context.Entity.FindAsync(id);
        throw new ConcurrencyException<Entity>(
            "RowVersion が一致しません。別のユーザーが同時に変更しました。",
            latestEntity
        );
    }

    // ★ ステップ 2: エンティティを更新
    entity.Property1 = request.Property1;
    entity.Property2 = request.Property2;
    entity.RowVersion = request.RowVersion; // 更新前データで比較するため設定

    // ★ ステップ 3: DB に保存
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException)
{
    // ★ ステップ 4: 後置チェック（DB レベルでの競合検出）
    // FindAsync で最新データを再取得（重要: 最新データを必ず含める）
    var latestEntity = await _context.Entity.FindAsync(id);
    throw new ConcurrencyException<Entity>(
        "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
        latestEntity  // 最新 DB データを返す（リクエストデータではなく）
    );
}
```

#### CREATE/DELETE 操作では try-catch 不要

```csharp
// ✅ 正しい: INSERT は try-catch 不要
_context.Entity.Add(entity);
await _context.SaveChangesAsync(); // DbUpdateConcurrencyException は発生しない

// ✅ 正しい: DELETE は try-catch 不要
_context.Entity.Remove(entity);
await _context.SaveChangesAsync(); // DbUpdateConcurrencyException は発生しない

// ❌ 避けるべき: INSERT/DELETE に try-catch をつけない
```

#### 重要なポイント
1. **最新 DB データを常に返す**: ConcurrencyException には必ず `FindAsync()` で取得した最新エンティティを渡す（クライアント側の再試行に必要）
2. **前置チェックは早期検出**: `SaveChangesAsync()` の前に RowVersion を比較することで、無駄な DB 処理を避ける
3. **後置チェックはフォールバック**: DB レベルでも競合検出（稀なケースをカバー）
4. **リクエストデータは返さない**: 古いリクエストデータではなく、DB から再取得した最新データをクライアントに返す

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

#### 単体テスト
- サービス層で RowVersion が不一致の時に `ConcurrencyException` が投げられることを検証
  - 前置チェック（SaveChangesAsync の前に throw）
  - 後置チェック（DbUpdateConcurrencyException のキャッチと再 throw）
- リクエストから最新 DB データが ConcurrencyException に含まれていることを確認

#### 結合テスト
- 同一リソースを並列で更新するシナリオで 409 が返ることを確認
- 409 を受け取った後、最新データを再取得 → 再試行が機能することを確認
- CREATE/DELETE 操作では DbUpdateConcurrencyException が発生しないことを確認

#### 手動テスト
1. 管理画面でリソース（ジャンル、タグ、スキルなど）を取得（RowVersion が返される）
2. 2つのタブで同じリソースを編集
3. タブ A で更新 → タブ B で更新試行
4. タブ B で 409 Conflict を受け取り、最新データが返されることを確認
5. タブ B でページをリロード → 最新データで再試行が成功することを確認

### 実運用上の運用メモ
- RowVersion は DB 側で `bytea`（Postgres）として保存される。アプリ側で `byte[]` として扱われ、JSON シリアライズは Base64 になる。
- フロントエンド／API クライアントで RowVersion の扱いを統一しておく（自動シリアライズ／デシリアライズの仕組みを整える）

### 参照箇所（コードベース内）

UPDATE 操作で DbUpdateConcurrencyException を処理するサービスメソッド（全て FindAsync パターン実装）:

**GenreService**
- `UpdateGenreAsync()`
- `SetGenreActiveStatusAsync()`

**TagService**
- `UpdateTagAsync()`
- `DeactivateTagAsync()`
- `ActivateTagAsync()`

**SkillService**
- `UpdateSkillAsync()`
- `DeactivateSkillAsync()`
- `ActivateSkillAsync()`
- `SetSkillCategoryAsync()`

**WorkspaceService**
- `UpdateWorkspaceAsync()`
- `DeactivateWorkspaceAsync()`
- `ActivateWorkspaceAsync()`

**WorkspaceItemService**
- `UpdateWorkspaceItemAsync()`
- `UpdateWorkspaceItemStatusAsync()`

**UserService**
- `UpdateUserAsync()`
- `UpdateUserAvatarAsync()`
- `SetUserActiveStatusAsync()`

**ProfileService**
- `UpdateEmailAsync()`

**OrganizationService**
- `UpdateOrganizationAsync()`
- `DeactivateOrganizationAsync()`
- `ActivateOrganizationAsync()`

**RoleService**
- `AddPermissionToRoleAsync()`
- `RemovePermissionFromRoleAsync()`

**WorkspaceItemRelationService**
- `AddRelationAsync()`
- `DeleteRelationAsync()`

**WorkspaceItemPinService**
- `RemovePinFromItemAsync()`

**コントローラー実装例**
- `pecus.WebApi/Controllers/Admin/AdminGenreController.cs`
- `pecus.WebApi/Controllers/Admin/AdminTagController.cs`
- `pecus.WebApi/Controllers/Admin/AdminSkillController.cs`
- `pecus.WebApi/Controllers/WorkspaceController.cs`

各コントローラーでは `ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)` を付与して 409 Conflict レスポンスを Swagger に記載しています。

---

### ドキュメント更新履歴

**2025-11-06 版**
- DbUpdateConcurrencyException の発生条件を明確化（UPDATE のみ）
- CREATE/DELETE 操作では try-catch 不要であることを明記
- 標準実装パターン（前置チェック + 後置チェック）を具体化
- **重要**: 最新 DB データを ConcurrencyException に渡すことの重要性を強調
- 参照箇所を全サービスメソッドで最新化
- テスト手法を具体化（手動テストシナリオを追加）

このドキュメントはプロジェクト内での実装方針と現状のコードパターンに基づいて作成しています。実装に変更が必生じた場合は、該当サービス／コントローラーの実装を参照し、このドキュメントを更新してください。
