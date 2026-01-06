## pecus.WebApi における DB 競合（楽観ロック）対応まとめ

## AI エージェント向け要約（必読）

- **コンテキスト**: EF Core 10 + PostgreSQL (`xmin`) による楽観的同時実行制御。
- **実装ルール**:
  - **RowVersion**: C# では `uint`、DB では `xmin`。フロントエンドへは `number` として渡す。
  - **更新処理**: `try-catch (DbUpdateConcurrencyException)` で囲む。
  - **例外処理**: catch ブロックで `FindAsync` して最新データを取得し、`ConcurrencyException<T>` をスロー。
  - **HTTP**: `GlobalExceptionFilter` が 409 Conflict を返す。
- **禁止事項**: `DbUpdateConcurrencyException.Entries` を使った複雑な復元（`FindAsync` でシンプルに再取得すること）。

このドキュメントは `pecus.WebApi` で採用している楽観的ロック（RowVersion）に関する短い要約と実装参照です。まずは全体の要点を短く示します。

要点（短縮版）
- RowVersion は PostgreSQL のシステムカラム `xmin` を利用し、アプリ側では C# の `uint`（unsigned int）で扱います。
- JSON の送受信では RowVersion は数値（number / integer）として扱うことを想定しています。フロントエンド自動生成クライアントは `number`/`integer` 型です。
- 実装パターン：サービス層で `DbUpdateConcurrencyException` を catch → `FindAsync()` で最新データを取得 → `ConcurrencyException<T>` を投げる。`GlobalExceptionFilter` が `IConcurrencyException` を検出して HTTP 409 を返します。
- クライアント側の振る舞い：更新時に最新の `rowVersion`（数値）を送信し、HTTP 409 を受け取ったら最新データを再取得（GET）→ マージ／再試行する。

注意（実装上のポイント）
- サーバー内のモデル／DTO は `uint` または `uint?` を用いて RowVersion を扱います（例：`UserRowVersion: uint?`、`ItemRowVersion: uint?`）。
- 前置チェックは不要です。後置で `SaveChangesAsync()` が失敗したときのみ競合処理を行う設計です（競合は稀なため追加クエリは許容される）。

主要参照箇所（実装例・リンク）
- `pecus.Libs/DB/ApplicationDbContext.cs` — `ConfigureRowVersionForAllEntities` により `RowVersion` を Postgres の `xmin` にマッピング
- `pecus.WebApi/Filters/GlobalExceptionFilter.cs` — `IConcurrencyException` を検出して 409 を返却するグローバルフィルタ
- `pecus.WebApi/Exceptions/ConcurrencyException.cs` — 型付き `ConcurrencyException<T>`（最新 DB データを保持して投げる）
- サービス実装例: `pecus.WebApi/Services/UserService.cs`, `pecus.WebApi/Services/WorkspaceItemTagService.cs`（`FindAsync()` 再取得パターン）
- リクエスト DTO 例: `pecus.WebApi/Models/Requests/UserRequests.cs`（`UserRowVersion: uint?`）、`pecus.WebApi/Models/Requests/WorkspaceItem/SetTagsToItemRequest.cs`（`ItemRowVersion: uint?`）

以下、詳細な設計方針と実装パターン（既存内容）を続けます。

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
    // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
    _context.Entry(entity).Property(e => e.RowVersion).OriginalValue = request.RowVersion;
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

**重要**: `entity.RowVersion = request.RowVersion` と書くと SET 句に含まれてしまいます。`xmin` はシステムカラムなので直接書き込めません。`OriginalValue` に設定することで、EF Core が WHERE 句に `xmin = @originalValue` を追加し、楽観ロックが機能します。

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
2. コントローラー内で `ConcurrencyException` を個別にキャッチして変換する必要はありません。`GlobalExceptionFilter` が `IConcurrencyException` を検出して 409 を返すため、コントローラーは通常の実装に集中してください。
3. OpenAPI/Swagger 用に 409 を明示するため、該当アクションに `ProducesResponseType(typeof(ConcurrencyErrorResponse<...>), StatusCodes.Status409Conflict)` を付与してください。

-### クライアント開発者向け注意事項
- 更新系リクエストには、最新の `RowVersion` を必ず含める（このリポジトリでは `rowVersion` を数値（number / integer）として送受信する設計です）。
- 409 Conflict を受け取ったら:
  1. エンティティの最新データを再取得する（GET）
  2. 必要に応じてマージや再編集を行い、再度更新リクエストを送る
- RowVersion を送らずに更新を許す設計もあるが、その場合は最終書き込みが勝つ（上書き）ので注意

### 例: リクエスト JSON（RowVersion の扱い）
```json
{
  "skillIds": [1, 2, 5],
  "userRowVersion": 123456
}
```

### エラー／例外ハンドリング
- サービス層は `ConcurrencyException` を投げる。コントローラー側で個別にキャッチする必要はなく、`GlobalExceptionFilter` が `IConcurrencyException` を検出して 409 を返す（`ConcurrencyErrorResponse<T>`）。エラーメッセージはユーザー向けにわかりやすくする。

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
- RowVersion は PostgreSQL のシステムカラム `xmin` にマッピングされます。アプリ側では `uint`（unsigned int）で表現し、フロントエンドとは数値（number/integer）でやり取りします。
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

#### 参照実装（ファイルへのリンク）
以下はこのドキュメントの設計方針に関係する主要実装ファイルへの直接リンクです（相対パス）。実装の参照や差分確認に便利です。

- `../pecus.Libs/DB/ApplicationDbContext.cs` — `ConfigureRowVersionForAllEntities` により `RowVersion` を PostgreSQL の `xmin` にマッピングしています。
- `../pecus.WebApi/Filters/GlobalExceptionFilter.cs` — `IConcurrencyException` を検出して HTTP 409 として返すグローバルフィルタの実装。
- `../pecus.WebApi/Exceptions/ConcurrencyException.cs` — 型付きの `ConcurrencyException<T>` 実装（最新 DB データを保持して投げる）。
- `../pecus.WebApi/Exceptions/IConcurrencyException.cs` — グローバルフィルタがチェックするインターフェイス。
- `../pecus.WebApi/Services/UserService.cs` — サービスの競合チェック・再取得パターンの例（`FindAsync` を使う箇所あり）。
- `../pecus.WebApi/Services/WorkspaceItemTagService.cs` — ItemRowVersion を使った事前チェックと、競合時の再取得パターンの例。
- `../pecus.WebApi/Models/Requests/UserRequests.cs` — `UserRowVersion` (`uint?`) を定義しているリクエスト DTO。
- `../pecus.WebApi/Models/Requests/WorkspaceItem/SetTagsToItemRequest.cs` — `ItemRowVersion` (`uint?`) を定義しているリクエスト DTO。
- `../pecus.Frontend/src/connectors/api/pecus/models/SetUserSkillsRequest.ts` — フロントエンド自動生成モデルの例（`userRowVersion?: number | null`）。

必要なら各ファイルの該当行番号も追加できます。指定があれば該当関数や行の範囲を追記します。

---

### Hangfire タスクでの特殊対応（RowVersion 競合回避）

**重要**: Hangfire バックグラウンドタスクでは、上記の「競合検出 → 409 → リトライ」パターンは適用しません。代わりに **競合を起こさない設計** を採用しています。

#### 理由

1. **HTTP レスポンスを返す相手がいない**: バックグラウンド処理では 409 を返しても意味がない
2. **並行実行の可能性**: 複数のタスクが同じエンティティを同時に更新する場合がある
3. **後勝ちで問題ない**: `ChatRoom.UpdatedAt` のような「最新アクティビティ時刻」は後勝ちで十分

#### 実装パターン（Hangfire タスク用）

```csharp
// ❌ NG: 追跡エンティティ経由の更新（RowVersion 競合リスクあり）
room.UpdatedAt = DateTimeOffset.UtcNow;
await _context.SaveChangesAsync();

// ✅ OK: ExecuteUpdateAsync で直接 SQL 更新（RowVersion チェックをスキップ）
await _context.ChatRooms
    .Where(r => r.Id == room.Id)
    .ExecuteUpdateAsync(s => s.SetProperty(r => r.UpdatedAt, DateTimeOffset.UtcNow));
```

#### 対象ファイル

- `pecus.Libs/Hangfire/Tasks/Bot/` 配下の全タスク
- `pecus.Libs/Hangfire/Tasks/MaintenanceNotificationTask.cs`

詳細は [`docs/bot-hangfire-tasks.md`](./bot-hangfire-tasks.md) の「DB 更新の特殊ケース」セクションを参照してください。

---
このドキュメントはプロジェクト内での実装方針と現状のコードパターンに基づいて作成しています。実装に変更が必要な場合は、該当サービス／コントローラーの実装を参照し、このドキュメントを更新してください。
