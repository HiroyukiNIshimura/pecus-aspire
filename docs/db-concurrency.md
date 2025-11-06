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
// 後置チェック（DB レベルの競合検出）のみ
try
{
    entity.Property1 = request.Property1;
    entity.Property2 = request.Property2;
    entity.RowVersion = request.RowVersion; // 比較用に設定
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException)
{
    // 最新データを再取得（重要: 最新データを必ず含める）
    var latestEntity = await _context.Entity.FindAsync(id);
    throw new ConcurrencyException<Entity>(
        "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
        latestEntity  // 最新 DB データを返す（リクエストデータではなく）
    );
}
```

#### パターンの特徴

1. **シンプルさ**: 前置チェックを削除し、後置チェック（catch）のみ
2. **DB による確実な検出**: EF Core が自動的に WHERE RowVersion を追加
3. **パフォーマンス最適**: 通常時は追加クエリなし、競合時のみ FindAsync() を呼ぶ
4. **保守性**: チェックロジックが1箇所に集約（DRY 原則）

#### なぜ `DbUpdateConcurrencyException.Entries` ではなく `FindAsync()` で再取得するのか

2つのアプローチの比較：

**方式 A: `DbUpdateConcurrencyException.Entries` を使用**
```csharp
catch (DbUpdateConcurrencyException ex)
{
    // Entries から CurrentValues, OriginalValues, DatabaseValues を抽出
    var databaseValues = ex.Entries[0].GetDatabaseValues();
    var latestEntity = (Entity)databaseValues?.ToObject();
    throw new ConcurrencyException<Entity>(..., latestEntity);
}
```
- 利点: 追加クエリなし、即座にデータが得られる
- 欠点: 複雑な API、Entries の操作が直感的でない、ナビゲーションプロパティが未ロード

**方式 B: `FindAsync()` で再取得（採用方式）** ✅
```csharp
catch (DbUpdateConcurrencyException)
{
    var latestEntity = await _context.Entity.FindAsync(id);
    throw new ConcurrencyException<Entity>(..., latestEntity);
}
```
- 利点:
  - **コードの意図が明確**: 「最新データを DB から取得する」という読みやすいコード
  - **ナビゲーションプロパティ対応**: Include を使えば関連データも取得可能
  - **保守性**: 複数の競合処理で統一パターンが使える
  - **競合は稀**: 追加クエリはほぼ発生しない（競合は稀なケース）
- 欠点: 競合時に 1 クエリ追加（許容範囲）

**結論**: **シンプルさと保守性を優先** して `FindAsync()` を採用。競合検出が稀であり、パフォーマンス差は無視できるため。

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
2. **DB が競合を確実に検出**: EF Core は SaveChangesAsync() 時に自動的に WHERE RowVersion を追加。不一致時は DbUpdateConcurrencyException が確実に発生
3. **シンプルさが利点**: 前置チェックを削除することで、コード行数削減・保守性向上・パフォーマンス改善を実現

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
- サービス層で RowVersion が不一致の時に `DbUpdateConcurrencyException` → `ConcurrencyException` が投げられることを検証
- ConcurrencyException に最新 DB データが含まれていることを確認

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

**2025-11-06 版（最新）**
- **前置チェック廃止**: DB による確実な検出で十分。シンプルさ・保守性・パフォーマンスを優先
- DbUpdateConcurrencyException の発生条件を明確化（UPDATE のみ）
- CREATE/DELETE 操作では try-catch 不要であることを明記
- 標準実装パターン: 後置チェック（catch）のみ
- **重要**: 最新 DB データを ConcurrencyException に渡すことの重要性を強調
- 参照箇所を全サービスメソッドで最新化
- テスト手法を具体化（手動テストシナリオを追加）

このドキュメントはプロジェクト内での実装方針と現状のコードパターンに基づいて作成しています。実装に変更が必要な場合は、該当サービス／コントローラーの実装を参照し、このドキュメントを更新してください。
