# バックエンド開発ガイドライン

## AI エージェント向け要約（必読）

- **コンテキスト**: .NET 10 / EF Core 10 / .NET Aspire ベースのマイクロサービスバックエンド。
- **最優先事項**:
  - **DTO は API 仕様書そのもの**: DTO はフロントエンド（または外部公開時）の API 仕様書と同等です。DTO を設計する際は「このエンドポイントを使うクライアント開発者が何を期待するか」を常に意識してください。一般ユーザー向けと管理者向けで異なる項目が必要な場合は、DTO を分離してください（例: `GetWorkspacesRequest` と `AdminGetWorkspacesRequest`）。
- **重要ルール**:
  - **コントローラー**: MVC コントローラー + `HttpResults`（`Ok<T>`, `Created<T>`）。`IActionResult` は禁止。
  - **競合制御**: `DbUpdateConcurrencyException` を catch → `FindAsync` で最新取得 → `ConcurrencyException<T>` をスロー。
  - **DTO**: 必ず検証属性（`[Required]`, `[MaxLength]`）を付与。`RowVersion` (`uint`) を含める。
  - **トランザクション**: サービス層で `BeginTransactionAsync` を使用。コントローラーでは禁止。
  - **禁止事項**: `HasDefaultValue` の使用（C#側で制御）、コントローラーでのビジネスロジック実装。
- **関連ファイル**:
  - `pecus.Libs/DB/ApplicationDbContext.cs` (DB設定)
  - `pecus.WebApi/Filters/GlobalExceptionFilter.cs` (例外ハンドリング)

## 1. アーキテクチャ概要

### .NET Aspire による分散マイクロサービス
このプロジェクトは単一プロセスのアプリケーションではなく、.NET Aspire によってオーケストレーションされるマイクロサービス群です（実行基盤は .NET 10 / EF Core 10）。

プロジェクト構成の主な要素:
- `pecus.AppHost`：Aspire のオーケストレーションホスト。サービス構成、依存関係、起動順序を定義します。
- `pecus.WebApi`：メインの REST API（JWT 認証、Hangfire クライアント、Swagger UI）
- `pecus.BackFire`：Hangfire ジョブの実行サーバー（ワーカープロセス）
- `pecus.DbManager`：DB マイグレーション管理。起動時に `DbInitializer` により自動マイグレーションを実行します。
- `pecus.Libs`：DB モデル、Hangfire タスク、メールサービス、シードデータなどの共有ライブラリ
- `pecus.ServiceDefaults`：Serilog、ヘルスチェック、OpenTelemetry などのサービス共通設定
- `pecus.Frontend`：フロントエンドアプリケーション（SPAやWeb UIなど、将来的な拡張用）

インフラ（`pecus.AppHost/AppHost.cs` に定義）:
- PostgreSQL：`pecusdb` データベース（ユーザー/パスワードは Aspire が注入）
- Redis：Hangfire キューの共有キャッシュ
- サービス依存関係：DbManager は Postgres を待ち、WebApi は Postgres と Redis を待ち、BackFire は Redis を待ちます

### データ層（`pecus.Libs`）
名前空間: `Pecus.Libs.DB`

エンティティ（`pecus.Libs/DB/Models/*.cs`）:
- User, Role, Permission（RBAC、M:N）
- Organization, Workspace, WorkspaceUser（マルチテナント）
- Genre（ワークスペース種別などのマスタ）

DbContext（`pecus.Libs/DB/ApplicationDbContext.cs`）:
- EF Core 10（PostgreSQL プロバイダ）
- Aspire からは `builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb")` で登録されます（接続文字列ではありません）
- リレーションは `OnModelCreating` にて定義されています

シードデータ（`pecus.Libs/DB/Seed/DatabaseSeeder.cs`）:
- `SeedAllAsync(bool isDevelopment)`: 実行環境に応じたシーディング
  - 本番: 権限・ロール・ジャンルなどのマスタデータのみ
  - 開発: 上記に加えて組織、ユーザー（admin/user123 等）、ワークスペース等のモックデータ
- `SeedDevelopmentDataAsync()` は開発用モックのみを挿入します

### バックグラウンドジョブ（Hangfire + Redis）
共有タスク（`pecus.Libs/Hangfire/Tasks/`）:
- `HangfireTasks.cs`: 汎用タスク（ログ、長時間処理、バッチ処理など）
- `EmailTasks.cs`: MailKit + RazorLight を使ったメール送信タスク（テンプレート送信、添付、バルク等）

クライアント（`pecus.WebApi`）:
- `IBackgroundJobClient` を DI 経由で注入し、`_backgroundJobClient.Enqueue<HangfireTasks>(x => x.Method(...))` でジョブをキューへ追加
- タスククラスは DI 登録され、Hangfire は DI 経由で依存性を解決します
- 開発時は `/hangfire` ダッシュボードを公開（`AllowAllDashboardAuthorizationFilter`）

サーバー（`pecus.BackFire`）:
- Redis からジョブを取得して実行
- DI 登録されたタスククラスを解決して実行します

重要点:
- **静的API（`BackgroundJob.Enqueue`, `RecurringJob.AddOrUpdate`）は使用禁止**。必ず DI 経由の `IBackgroundJobClient` / `IRecurringJobManager` を使用すること
- `Enqueue<T>()` では型パラメータを使ってシリアライズ互換性を保つこと
- タスククラスは WebApi 側と BackFire 側の両方で DI 登録すること
- ループ内のラムダでループ変数を直接捕捉せず、ローカルコピーを作ること（クロージャ問題）

### マイグレーション戦略（`pecus.DbManager`）
起動時自動マイグレーション（`DbInitializer.cs`）:
```csharp
// pecus.DbManager/DbInitializer.cs（IHostedService）
public async Task StartAsync(CancellationToken cancellationToken)
{
    await _context.Database.MigrateAsync(cancellationToken);
    await _seeder.SeedAllAsync(_environment.IsDevelopment());
}
```

手動エンドポイント（`AppHost.cs`）:
- `POST /reset-db`（開発環境限定）で DB をドロップ → 再作成 → マイグレーション → シード を実行します（コントローラではなく AppHost に実装）

エントリポイントは `AppHost.cs`（`Program.cs` ではない）という命名規約を利用しています。

## 2. DB新規作成・変更時のフロー

DB スキーマを新規作成または変更する場合、以下のフローに従ってください：

#### 1. DB モデル定義（`pecus.Libs/DB/Models/`）
- `pecus.Libs/DB/Models/` に新規エンティティクラスを作成、または既存モデルを変更
- XML ドキュメントコメントで各プロパティの意図を記述
- 必須プロパティには `required` キーワード、nullable プロパティは `?` で明示

#### 2. DbContext 設定（`pecus.Libs/DB/ApplicationDbContext.cs`）
- `OnModelCreating` にて新規エンティティのリレーション、インデックス、デフォルト値を定義
- 既存モデルとの関連性を明確に設定

#### 3. マイグレーション生成（`pecus.DbManager`）
```bash
# pecus.DbManager プロジェクトディレクトリで実行
dotnet ef migrations add <MigrationName> --project pecus.DbManager --startup-project pecus.DbManager
```
- マイグレーションファイルは `pecus.DbManager/Migrations/` に配置
- マイグレーション名は `YYYYMMDDHHMMSS_DescriptiveAction` の形式で命名

#### 4. **DTO の確認・更新（`pecus.WebApi/Models/Requests/`） ← 最重要**

> **DTO は API 仕様書そのものです。**
>
> DTO を設計する際は「このエンドポイントを使うフロントエンド開発者（または外部クライアント）が何を期待するか」を常に意識してください。DTO の構造がそのまま OpenAPI 仕様書に反映され、自動生成されるクライアントコードの型定義になります。

**DTO 分離の原則**:
- 一般ユーザー向けと管理者向けで異なる項目が必要な場合は、**必ず DTO を分離**してください
- 例: `GetWorkspacesRequest`（一般用）と `AdminGetWorkspacesRequest`（管理者用：`IsActive` フィルタを含む）
- 一般ユーザーに不要な項目を含めると、API 仕様書として誤解を招き、セキュリティリスクにもなります

**DB スキーマ変更時は、対応するリクエスト DTO をすべて確認・更新する必要があります：**

- **作成リクエスト** (`CreateXxxRequest`):
  - DB の必須項目がすべて含まれているか確認
  - クライアントが指定できるべき項目が漏れていないか確認
  - デフォルト値を持つ項目（例: `IsActive = true`）はリクエスト DTO に不要な場合が多い
  - サーバー側で生成する項目（ID、タイムスタンプ、ユーザーID など）は DTO に含めない

- **更新リクエスト** (`UpdateXxxRequest`):
  - 更新対象の項目がすべてカバーされているか確認
  - 新しく追加された項目に対応するプロパティを追加
  - nullable で定義し、送信されない項目は `null` として扱う

- **フィルタ・検索リクエスト** (`GetXxxRequest`):
  - 新しいフィルタ条件が必要な場合は対応する項目を追加
  - 既存のフィルタ条件に変更がないか確認

- **検証属性の設定**:
  - `[Required]`, `[MaxLength]`, `[Range]` など入力検証属性を必ず付与
  - DB のカラム長制限に合わせた `MaxLength` を指定
  - エラーメッセージは日本語で具体的に記述

- **レスポンスDTOのEnumフィールド**:
```
[JsonConverter(typeof(JsonStringEnumConverter<ChatRoomType>))]
public required ChatRoomType Type { get; set; }
```
のようにJsonStringEnumConverterを必ず指定する。

**DTO チェックリスト**:
- [ ] **API 仕様書として適切か**: フロントエンド開発者がこの DTO を見て、何を送るべきか明確に理解できるか
- [ ] **ユーザー種別ごとの分離**: 一般ユーザー向けと管理者向けで異なる項目がある場合、DTO を分離したか
- [ ] DB モデルの全必須項目が作成リクエストに含まれているか
- [ ] 更新リクエストに新しい項目が追加されたか
- [ ] すべてのプロパティに検証属性が付与されているか
- [ ] 最大長制限が DB スキーマと一致しているか
- [ ] `required` キーワードの使用が適切か
- [ ] エラーメッセージが日本語で具体的か
- [ ] エラーメッセージが日本語で具体的か
- [ ] レスポンスDTOのEnumフィールドは指定属性が付与されているか

#### 5. ビルド確認
```bash
dotnet build pecus.sln
```
- コンパイルエラーがないことを確認
- 警告がないことを確認（DTO の検証属性関連など）

#### 6. アプリ起動と動作確認
```bash
dotnet run --project pecus.AppHost
```
- マイグレーションが正常に実行されるか確認
- 新規エンドポイントが Swagger UI で表示されるか確認（DTO が正しく反映されているか）
- API 経由でデータの作成・更新が正常に動作するか確認

## 3. 実装パターン

### コントローラ構成（WebApi 層）

エンドポイントの配置方針:
- `Controllers/`：一般ユーザー向けの認証済みエンドポイント（例: `WorkspaceController`）
- `Controllers/Admin/`：組織管理者向けのエンドポイント（例: `AdminUserController`）
- `Controllers/Backend/`：内部サービス間のエンドポイント（例: `BackendJobController`）
- `Controllers/Entrance/`：未認証用の公開エンドポイント（例: `EntranceAuthController`）

### Aspire によるサービス登録
接続文字列ではなく Aspire に定義されたリソース名を使う点に注意してください（例: `pecusdb`, `redis`）。
```csharp
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");
builder.AddRedisClient("redis");
```

### リクエスト DTO パターン
すべてのサービスメソッドはリクエストオブジェクトを受け取る設計にしてください（パラメータ列ではなく DTO を使う）。

ページングはクライアントから `page` のみ受け取り、`pageSize` はサーバー側で固定値を使います（サーバー性能担保のため）。

### 内部メソッド引数の設計ルール
**目的**: 同じ型の引数が複数ある場合、呼び出し側での引数の置き間違え（typo）を防止する。

**基本ルール**:
同じ型の引数が2個以上ある場合、**名前付き引数での呼び出しを必須**とする。

**適用対象**:
- `int A, int B, int C` のような複数の int 引数
- `string A, string B, string C` のような複数の string 引数
- `bool A, bool B, bool C` のような複数の bool 引数

### コントローラー戻り値ポリシー（MVC Controller + HttpResults）
本プロジェクトでは「最小APIより規模が大きくなっても人間が管理しやすい」ことを理由に MVC コントローラーを採用します。そのうえで、戻り値は `Microsoft.AspNetCore.Http.HttpResults` 系（TypedResults）を用いて型安全性を担保します。

方針（必読）:
- コントローラーは MVC を採用する。
- 戻り値は `HttpResults` 系（例: `Ok<T>`, `Created<T>`, `NoContent`）。`IActionResult`/`ActionResult<T>` は使用しない。
- 成功パスが単一であれば具体型（例: `Task<Ok<TResponse>>`）を返す。成功パスが複数ある場合のみ `Results<...>` ユニオンを用いる。
- エラーパスはサービス層で例外を投げ、`GlobalExceptionFilter` が HTTP ステータス（400/404/409/500 等）にマッピングする。コントローラーで try/catch はしない。
- OpenAPI 生成のために `ProducesResponseType` を必ず付与（成功 200/201 等に加え、例外経由の 400/404/409/500 を明示）。

### 検証属性（Validation）ルール
 - リクエスト DTO のプロパティには必ず入力検証属性を付与してください。特に DB に保存されるフィールドはスキーマに沿った長さ制限・必須チェックを行ってください。
 - 文字列の必須項目には `[Required(ErrorMessage = "○○は必須です。" )]` を付与します（メッセージは具体的に）。
 - 文字列の最大長には `[MaxLength(n, ErrorMessage = "○○はn文字以内で入力してください。")]` を付与してください。DB のカラム長に合わせた n を指定してください。
 - 文字列の最小・最大長には `[StringLength(min, max, ErrorMessage = "○○はmin〜max文字以内で入力してください。")]` を付与してください。DB のカラム長に合わせた n を指定してください。
 - 数値の範囲には `[Range(min, max, ErrorMessage = "○○はmin〜maxの範囲で指定してください。")]` を付与してください。
 - URL やメールアドレスは `[Url]` / `[EmailAddress]` を併用し、必要に応じて `[StringLength]` で長さ制限を行ってください。
 - 配列／リスト（例: `List<string> TagNames`, `List<int> SkillIds`）の要素検証は DataAnnotations 単体では表現しづらいので、要件がある場合はカスタムバリデータ（`ValidationAttribute` の派生）か `IValidatableObject` 実装を用いて要素ごとの検証（非空、最大長、範囲など）を行ってください。
 - ErrorMessage は必ず日本語で具体的に記述してください（例: `"件名は200文字以内で入力してください。"`）。

### OpenAPI 設定（スキーマトランスフォーマー）

本プロジェクトでは `Microsoft.AspNetCore.OpenApi` を使用して OpenAPI スキーマを生成しています。.NET 10 での OpenAPI 生成の挙動を制御するため、以下のカスタムトランスフォーマーを使用しています。

**設定ファイル**: `pecus.WebApi/AppHost.cs`

```csharp
builder.Services.AddOpenApi("v1", options =>
{
    options.OpenApiVersion = OpenApiSpecVersion.OpenApi3_0; // 3.0 に固定

    // 整数型を integer のみに統一（integer | string のユニオン型を防止）
    options.AddSchemaTransformer<IntegerSchemaTransformer>();

    // Enum を文字列として出力
    options.AddSchemaTransformer<EnumSchemaTransformer>();
});
```

**重要な設計決定**:

1. **OpenAPI 3.0 に固定**: OpenAPI 3.1 では `nullable` の扱いや `integer` の出力形式が異なるため、安定性のため 3.0 を使用。

2. **IntegerSchemaTransformer** (`pecus.WebApi/OpenApi/IntegerSchemaTransformer.cs`):
   - .NET 10 では整数型が `integer | string` のユニオン型として出力される問題を修正
   - TypeScript 生成時に `number | string` になることを防止

3. **EnumSchemaTransformer** (`pecus.WebApi/OpenApi/EnumSchemaTransformer.cs`):
   - Enum を文字列リテラル型として出力（`'Value1' | 'Value2' | ...`）
   - `Nullable<Enum>` の場合は `| null` を含む型として出力

**フロントエンドへの影響**:
- Enum 型は `'Value1' | 'Value2' | ... | null`（nullable の場合）として生成される
- フロントエンドで `Record<EnumType, ...>` を使用する場合は `NonNullable<EnumType>` を使用すること
- `<select value={enumValue}>` では `enumValue ?? ''` または `enumValue ?? 'デフォルト値'` でデフォルト値を設定すること

### 複数テーブルにまたがる操作のトランザクション
複数テーブルの変更が発生する処理（生成・削除・多対多の更新等）はサービス層で明示的にトランザクションを開始して処理してください。

例:
```csharp
using var transaction = await _context.Database.BeginTransactionAsync();
try {
  // DB 操作
  await transaction.CommitAsync();
} catch {
  await transaction.RollbackAsync();
  throw;
}
```

なお、トランザクション処理をコントローラー層に持ち込まないでください。

### Entity Framework Core のパフォーマンス最適化

#### デカルト爆発（Cartesian Explosion）の回避

複数の `Include()` を使用する際、デカルト爆発によるパフォーマンス劣化に注意してください。

**推奨する解決策:**

1. **AsSplitQuery() を使用（推奨）**
   ```csharp
   // ✅ 推奨：分割クエリで複数のSQLに分ける
   var query = _context.Users
       .Include(u => u.Roles)
       .Include(u => u.UserSkills)
       .Include(u => u.WorkspaceUsers)
       .AsSplitQuery() // デカルト爆発防止
       .ToListAsync();
   ```

2. **ThenInclude() でネストを最小化**
3. **フィルタ付きInclude（EF Core 5.0+）**

#### ページネーション実装の注意点

**CountAsync() と ToListAsync() の一貫性を保つ:**

```csharp
// ✅ 正しいパターン
var query = _context.Users
    .Include(u => u.Roles)
    .Include(u => u.UserSkills)
        .ThenInclude(us => us.Skill)
    .Where(u => u.OrganizationId == organizationId);

// フィルタ条件を追加
if (isActive.HasValue) {
    query = query.Where(u => u.IsActive == isActive.Value);
}

query = query.OrderBy(u => u.Id);

// AsSplitQueryを使用してデカルト爆発防止
var totalCount = await query.CountAsync();
var users = await query.AsSplitQuery().Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
```

### Enum の使用方針

Entity Framework Core で Enum を使用する際は、以下の方針に従ってください。

#### Enum の定義場所

- **配置**: `pecus.Libs/DB/Models/Enums/` に配置
- **名前空間**: `Pecus.Libs.DB.Models.Enums`
- **命名規則**: Pascal Case（例: `TaskPriority`, `TaskType`）

#### Enum の基本設計

**設計ルール**:
- 値は必ず明示的に指定（`0` から始めない、`1` 始まりを推奨）
- XML ドキュメントコメントを必ず付与
- 意味のある名前を使用（`Value1`, `Value2` などは避ける）

#### エンティティでの Enum 使用

**✅ 推奨パターン（nullable）**:
```csharp
public class WorkspaceItem
{
    /// <summary>
    /// 重要度（NULL の場合は Medium として扱う）
    /// </summary>
    public TaskPriority? Priority { get; set; }
}
```

**利点**:
- `NULL` = 「未設定」という意味が明確
- EF Core の警告が発生しない
- アプリケーション層で柔軟にデフォルト値を制御可能

#### ベストプラクティス

1. **nullable を基本とする**: `TaskPriority?` を使用し、警告を回避
2. **明示的な値を設定**: `0` から始めず、`1` 始まりを推奨
3. **ドキュメント化**: XML コメントで各値の意味を明記
4. **デフォルト値はアプリ層で**: `HasDefaultValue()` ではなく、コード内で `??` 演算子を使用
5. **文字列変換は避ける**: 整数値のまま保存（パフォーマンスとストレージ効率）
6. **API レスポンス**: Enum 値は整数で返される（フロントエンドで表示名マッピング）

## 4. その他

### Hangfire タスクの共有パターン
タスクは `pecus.Libs` に実装し、WebApi（クライアント）と BackFire（サーバー）の両方で DI 登録してください。静的メソッドやグローバルな BackgroundJob 呼び出しは避けてください。

ループ内でジョブをキューイングする際はローカルコピーを使ってクロージャの問題を避けてください。

### 環境感知型シーディング
`DatabaseSeeder` は `IWebHostEnvironment.IsDevelopment()` を参照して、開発環境ではモックデータまで投入するようにしてください。

### マイグレーションの配置
EF Core のマイグレーションは `pecus.DbManager` プロジェクトに置き、そこで管理・適用します。

### ロギング（Serilog）
全サービスで Serilog を採用しています。設定は `pecus.ServiceDefaults/Extensions.cs` にあります。開発環境では EF Core の SQL ログを詳細に出して問題解析を容易にしてください。

構造化ログの例:
```csharp
_logger.LogInformation("User {UserId} logged in from {IpAddress}", me, ipAddress);
```

### メール（MailKit + RazorLight）

テンプレートとサービスは `pecus.Libs/Mail/` 以下に実装します。開発時は MailHog 等のローカル SMTP を使って実運用メールを送らずにテストしてください。

### メールテンプレートのデザイン統一ポイント
- レイアウトは必ず共通のベーステンプレート（例: `_Layout.html.cshtml`）を継承してください。
- フォントはWebセーフなもの（例: 'Segoe UI', 'Hiragino Sans', Arial, sans-serif）を指定し、全テンプレートで統一してください。
- 余白・パディング・フォントサイズはインラインCSSで明示し、各要素の見た目が崩れないようにしてください。
 - ボタンやリンクはブランドカラー（例: `# 0078D4` など）を使い、角丸・影なども統一してください。
- ヘッダー・フッター・署名部分は必ず共通化し、テンプレートごとに差異が出ないようにしてください。
- 画像やロゴは絶対パスではなく、必ずパブリックなURLまたはCID埋め込みで指定してください。
- レスポンシブ対応は最低限（横幅600px固定＋スマホでの折り返し）を意識してください。
- テキストカラー・背景色・リンク色はアクセシビリティを考慮し、コントラスト比を十分に確保してください。
- メール本文の冒頭には必ず宛名や挨拶文を入れ、テンプレートごとに文体がぶれないようにしてください。
- テンプレートのサンプルや共通パーツは `pecus.Libs/Mail/Templates/` にまとめて管理してください。
