# Pecus Aspire - AI エージェント向け指示（日本語）

## プロジェクト方針
Conversation-Driven Development（会話駆動開発）：AI とペアプログラミングする形で反復的に問題を解決します。投機的な設計を避け、反復を通して進めます。本リポジトリはスタンドアロン API から進化し、.NET Aspire を用いた分散マイクロサービス構成になっています。

### プロジェクト横断変更の禁止ルール

**重要**: 1つのプロジェクトに対する修正を依頼された場合、他のプロジェクトまで一度に変更を加えてはいけません。

- 修正対象は指定されたプロジェクトのみに限定してください
- 他のプロジェクトの修正が必然的に必要な場合のみ、対象となる各プロジェクトについて以下をまとめて通知してください：
  - **目的**: なぜその修正が必要か
  - **影響範囲**: どのファイル・機能が影響を受けるか
  - **推奨する差分**: 変更内容を簡潔に説明
- 通知後は、該当プロジェクト側での承認を待つか、別作業として扱うようにしてください
- ユーザーから明示的な承認なしに複数プロジェクトへの変更を実行しないこと

## アーキテクチャ概要

### .NET Aspire による分散マイクロサービス
このプロジェクトは単一プロセスのアプリケーションではなく、.NET Aspire 9.0 によってオーケストレーションされるマイクロサービス群です。


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

### フロントエンド（`pecus.Frontend`）のアーキテクチャ

`pecus.Frontend` は Next.js（React）+ TypeScript によるSPA/Web UI拡張用ディレクトリです。主なアーキテクチャ方針は以下の通りです。

- **フレームワーク**: React（Next.js）
- **型安全**: TypeScript
- **状態管理**: jotai
- **UIライブラリ**: Tailwind CSS + FlyonUI
- **API通信**: OpenAPI/Swagger定義に基づく型安全なクライアント生成（例: openapi-generator, axios, react-query）
- **認証**: pecus.WebApiのJWT認証と連携（next-auth）
- **ルーティング**: SPAルーター（Next.jsのApp Router）
- **テスト**: Jest, React Testing Library, Playwright など
- **CI/CD**: GitHub Actions等での自動ビルド・デプロイ

API設計や認証フローは `pecus.WebApi` 側の仕様に厳密に従ってください。アクセストークンの保存・送信方法やエラーハンドリングもセキュリティ要件に合わせて実装します。

開発時は `npm install` → `npm run dev` でローカル開発サーバーを起動し、バックエンドAPIと連携して動作確認を行ってください。

#### APIアクセスルール
- **必須**: `createPecusApiClients()` メソッドでクライアントインスタンスを生成し、`pecus.WebApi` にアクセスすること
- **禁止**: クライアントコードから直接 `pecus.WebApi` へのアクセス
- **Next.js API Routes活用**: サーバーページでアクセスできない場合は、Next.js の API Routes 機能で `pecus.WebApi` へアクセスし、クライアントへデータを戻すこと
- **SSR優先**: SSR側でフェッチ可能なデータは、SSR側でフェッチすること
- **リフレッシュトークン管理**: Axiosインターセプターが自動的にトークンリフレッシュを処理しているため、他のコードで明示的にリフレッシュ処理を実装しないこと

#### API クライアントの自動生成
- **自動生成ファイル**: `src/connectors/api/PecusApiClient.generated.ts` は自動生成されるため、手動で編集しないこと
- **生成スクリプト**: `scripts/generate-pecus-api-client.js` が OpenAPI 定義から API クライアントを生成
- **自動実行**: `npm run dev` / `npm run build` の実行前に自動的に生成スクリプトが実行される（`predev` / `prebuild` フック）
- **手動実行**: 必要に応じて `npm run generate:client` で手動実行可能
- **Git管理**: 自動生成ファイルは `.gitignore` に登録済み

#### アクセストークン管理の設計方針
- **保存場所**: アクセストークンは `localStorage` に、リフレッシュトークンは `httpOnly` Cookie に保存
- **トークン取得**: `getAccessToken()` 関数を使用（`src/connectors/api/auth.ts`）
- **自動リフレッシュ**:
  - クライアントサイド: Axios インターセプターが 401 エラーを検知して自動リフレッシュ
  - サーバーサイド: Next.js Middleware が事前にトークンを検証・リフレッシュ
- **リフレッシュ条件**:
  - ステータスコード 401
  - `www-authenticate` ヘッダーに `Bearer error="invalid_token"` が含まれる
  - リトライフラグ（`__pecus_retry`）が設定されていない
- **競合防止**: インスタンスレベルの `refreshPromise` で同時リフレッシュを防止
- **失敗時の処理**: リフレッシュ失敗時は自動的に `/signin` へリダイレクト

実装サンプルは
- `pecus.Frontend/src/app/(dashbord)/admin/page.tsx`: SSRページ
- `pecus.Frontend/src/app/(dashbord)/admin/AdminClient.tsx`: クライアントコンポーネント
- `pecus.Frontend/src/connectors/api/PecusApiClient.ts`: API クライアント設定（手動編集可能）
- `pecus.Frontend/src/connectors/api/PecusApiClient.generated.ts`: API クライアント生成部分（自動生成）

#### Next.js 固有の注意事項
- **動的レンダリング**: Server Actions を使用するページには `export const dynamic = 'force-dynamic'` を設定
- **エラーハンドリング**: try-catch で API エラーを適切にハンドリングし、ユーザーにフィードバックを提供
- **ローディング状態**: データフェッチ中は適切なローディングインジケーターを表示
- **環境変数**: pecus.WebApiのベース URL は `process.env.API_BASE_URL`で管理
- **Server Actions**: SSR でのデータ取得には Server Actions（`src/actions/`）を使用
- **クライアントコンポーネント**: インタラクティブな機能には `"use client"` ディレクティブを付与

#### SSR（サーバーサイドレンダリング）アーキテクチャ

ページ構成は以下の統一パターンに従ってください：

**パターン: `page.tsx` (SSR) + `XxxClient.tsx` (Client Component)**

```
src/app/(dashboard)/admin/xxxxx/
  ├── page.tsx              # Server Component (SSR)
  └── XxxClient.tsx         # Client Component ("use client")
```

- **`page.tsx` (SSR/Server Component の責務)**
  - `export const dynamic = 'force-dynamic'` を必ず設定
  - Server Actions で `getCurrentUser()` や API データを fetch
  - Props 経由でクライアントコンポーネントにデータを传达
  - サーバーサイドのエラーハンドリング（try-catch）
  - 認証チェック・認可チェック

- **`XxxClient.tsx` (Client Component の責務)**
  - `"use client"` ディレクティブ必須
  - UI レンダリングのみ
  - ローカル状態管理（UI の開閉、フォーム入力、ページング、フィルタなど）
  - インタラクティブなイベントハンドラー
  - **重要**: SSR からの Props 経由でデータ受け取り、クライアント側での API 呼び出しはしない

**禁止事項（アンチパターン）**
- ❌ クライアント側で `useEffect` で `/api/user` などの API 呼び出しをしないこと
- ❌ ページ全体を `"use client"` でマークし、クライアント内で全 API 呼び出しをすること
- ❌ マスタデータ（ジャンル、スキル、タグなど）をクライアント側で fetch すること
- ❌ 同じデータを複数箇所から fetch すること（SSR で一度に fetch して Props で配分）

**実装例**
```typescript
// page.tsx (SSR)
export const dynamic = 'force-dynamic';
export default async function AdminTagsPage() {
  let user = null;
  let fetchError = null;
  try {
    const result = await getCurrentUser();
    if (result.success) user = result.data;
  } catch (err) {
    fetchError = err.message;
  }
  return <AdminTagsClient initialUser={user} fetchError={fetchError} />;
}

// AdminTagsClient.tsx (Client)
"use client";
export default function AdminTagsClient({ initialUser, fetchError }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // UI state のみ管理、API 呼び出しなし
  return <div>...</div>;
}
```

#### ページネーション実装
- **共通コンポーネント**: `src/components/common/Pagination.tsx` を使用
- **ライブラリ**: `react-paginate` を使用し、FlyonUI スタイルで統一
- **ページ番号**: サーバー側は 1-based、`react-paginate` は 0-based のため変換が必要
- **スタイリング**: `gap-0.5` でボタン間に適度な間隔を設定
- **条件表示**: `totalPages <= 1` の場合は自動的に非表示


#### HTML生成ルール
- **button要素**: 必ず `type` 属性を正しく設定すること（例: `type="button"`, `type="submit"`, `type="reset"`）
- **label要素**: 必ず `for` 属性を正しく設定し、対応するinput要素のidと一致させること

### データ層（`pecus.Libs`）
名前空間: `Pecus.Libs.DB`

エンティティ（`pecus.Libs/DB/Models/*.cs`）:
- User, Role, Permission（RBAC、M:N）
- Organization, Workspace, WorkspaceUser（マルチテナント）
- Genre（ワークスペース種別などのマスタ）

DbContext（`pecus.Libs/DB/ApplicationDbContext.cs`）:
- EF Core 9.0（PostgreSQL プロバイダ）
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
- `BackgroundJob.Enqueue<HangfireTasks>(x => x.Method(...))` でジョブをキューへ追加
- タスククラスは DI 登録され、Hangfire は DI 経由で依存性を解決します
- 開発時は `/hangfire` ダッシュボードを公開（`AllowAllDashboardAuthorizationFilter`）

サーバー（`pecus.BackFire`）:
- Redis からジョブを取得して実行
- DI 登録されたタスククラスを解決して実行します

重要点:
- `BackgroundJob.Enqueue<T>()` では型パラメータを使ってシリアライズ互換性を保つこと
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

## コントローラ構成（WebApi 層）

エンドポイントの配置方針:
- `Controllers/`：一般ユーザー向けの認証済みエンドポイント（例: `WorkspaceController`）
- `Controllers/Admin/`：組織管理者向けのエンドポイント（例: `AdminUserController`）
- `Controllers/Backend/`：内部サービス間のエンドポイント（例: `BackendJobController`）
- `Controllers/Entrance/`：未認証用の公開エンドポイント（例: `EntranceAuthController`）

設置ガイドライン:
1. 一般ユーザー向けで認証が必要なら `Controllers/` に置く
2. 管理者操作は `Controllers/Admin/` に置く
3. サービス間通信は `Controllers/Backend/` に置く（外部公開しない）
4. ログイン・登録などは `Controllers/Entrance/` に置く

例（抜粋）:
```csharp
[ApiController]
[Route("api/workspaces")]
public class WorkspaceController : ControllerBase { }

[ApiController]
[Route("api/admin/users")]
public class AdminUserController : ControllerBase { }

[ApiController]
[Route("api/backend/jobs")]
public class BackendJobController : ControllerBase { }

[ApiController]
[Route("api/entrance/auth")]
[AllowAnonymous]
public class EntranceAuthController : ControllerBase { }
```

## 重要なパターン

### Aspire によるサービス登録
接続文字列ではなく Aspire に定義されたリソース名を使う点に注意してください（例: `pecusdb`, `redis`）。
```csharp
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");
builder.AddRedisClient("redis");
```

サービス参照や起動順は `.WithReference()` / `.WaitFor()` を使って明示します。

### リクエスト DTO パターン
すべてのサービスメソッドはリクエストオブジェクトを受け取る設計にしてください（パラメータ列ではなく DTO を使う）。

ページングはクライアントから `page` のみ受け取り、`pageSize` はサーバー側で固定値を使います（サーバー性能担保のため）。

### Results パターン（コントローラーの戻り値）
コントローラーのアクションメソッドは `IActionResult` ではなく `Results<T>` を使用してください。これにより型安全性を確保し、OpenAPI/Swagger で正確なレスポンス仕様を生成できます。

戻り値のルール:
- 成功レスポンス: `TypedResults.Ok<T>(responseModel)` を使用
- エラーレスポンス: `TypedResults.NotFound<T>(responseModel)`, `TypedResults.BadRequest<T>(responseModel)` などを使用
- ステータスコード指定: `TypedResults.StatusCode(code)` を使用

各メソッドに `ProducesResponseType` 属性を付与:
```csharp
[ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(MessageResponse), StatusCodes.Status400BadRequest)]
public Results<Ok<MessageResponse>, BadRequest<MessageResponse>> SomeAction()
{
    // 実装
}
```

共通レスポンスモデル:
- `MessageResponse`: 汎用メッセージレスポンス（`{ Message: string }`）
- `JobResponse`: Hangfire ジョブIDを含むレスポンス（`MessageResponse` を継承）
- `ContinuationResponse`: 親子ジョブIDを含むレスポンス
- `RecurringResponse`: 繰り返しジョブIDを含むレスポンス
- `BatchResponse`: ジョブIDリストを含むレスポンス
- 必要に応じて専用レスポンスモデルを作成（例: `RefreshResponse`）

検証属性（Validation）ルール
 - リクエスト DTO のプロパティには必ず入力検証属性を付与してください。特に DB に保存されるフィールドはスキーマに沿った長さ制限・必須チェックを行ってください。
 - 文字列の必須項目には `[Required(ErrorMessage = "○○は必須です。" )]` を付与します（メッセージは具体的に）。
 - 文字列の最大長には `[MaxLength(n, ErrorMessage = "○○はn文字以内で入力してください。")]` を付与してください。DB のカラム長に合わせた n を指定してください。
 - 文字列の最小・最大長には `[StringLength(min, max, ErrorMessage = "○○はmin〜max文字以内で入力してください。")]` を付与してください。DB のカラム長に合わせた n を指定してください。
 - 数値の範囲には `[Range(min, max, ErrorMessage = "○○はmin〜maxの範囲で指定してください。")]` を付与してください。
 - URL やメールアドレスは `[Url]` / `[EmailAddress]` を併用し、必要に応じて `[StringLength]` で長さ制限を行ってください。
 - 配列／リスト（例: `List<string> TagNames`, `List<int> SkillIds`）の要素検証は DataAnnotations 単体では表現しづらいので、要件がある場合はカスタムバリデータ（`ValidationAttribute` の派生）か `IValidatableObject` 実装を用いて要素ごとの検証（非空、最大長、範囲など）を行ってください。
 - ErrorMessage は必ず日本語で具体的に記述してください（例: `"件名は200文字以内で入力してください。"`）。
 - 変更後はソリューション全体をビルドして（`dotnet build pecus.sln`）エラーや警告が出ないことを確認してください。

小さな設計ルール
 - クライアントから受け取る `page` は検証で `>=1` を保証すること。`pageSize` はサーバー側で固定するか、検証で上限を設けてください（例: 1〜100）。
 - DB スキーマが参照可能な場合は、カラムの最大長を優先して DTO の文字数制限に反映してください。
 - リクエスト DTO の変更は API の互換性に影響するため、必要ならバージョニング（エンドポイントのバージョン番号）を検討してください。

### 型付けされた例外ハンドリング
`NotFoundException` や `DuplicateException` 等のカスタム例外を使用し、メッセージ解析に依存しない実装にしてください。

### 認証とワークスペースアクセス制御（重要）
ログイン中ユーザーの取得は直接行ってください（グローバルに `[Authorize]` が設定されているためコントローラ内で `IsAuthenticated` をチェックする必要はありません）。

ユーザーID取得例（推奨）:
```csharp
var me = JwtBearerUtil.GetUserIdFromPrincipal(User);
```

注意: プロジェクト内のコーディング規約として、ログイン中のユーザーを表すローカル変数名は一貫して `me` を使用してください。

ワークスペースアクセスは `WorkspaceAccessHelper` を経由してチェックします。存在しない／アクセス不可は 404 を返す設計です。

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

### Hangfire タスクの共有パターン
タスクは `pecus.Libs` に実装し、WebApi（クライアント）と BackFire（サーバー）の両方で DI 登録してください。静的メソッドやグローバルな BackgroundJob 呼び出しは避けてください。

ループ内でジョブをキューイングする際はローカルコピーを使ってクロージャの問題を避けてください。

### 環境感知型シーディング
`DatabaseSeeder` は `IWebHostEnvironment.IsDevelopment()` を参照して、開発環境ではモックデータまで投入するようにしてください。

### マイグレーションの配置
EF Core のマイグレーションは `pecus.DbManager` プロジェクトに置き、そこで管理・適用します。

## ロギング（Serilog）
全サービスで Serilog を採用しています。設定は `pecus.ServiceDefaults/Extensions.cs` にあります。開発環境では EF Core の SQL ログを詳細に出して問題解析を容易にしてください。

構造化ログの例:
```csharp
_logger.LogInformation("User {UserId} logged in from {IpAddress}", me, ipAddress);
```

## メール（MailKit + RazorLight）

テンプレートとサービスは `pecus.Libs/Mail/` 以下に実装します。開発時は MailHog 等のローカル SMTP を使って実運用メールを送らずにテストしてください。

### メールテンプレートのデザイン統一ポイント
- レイアウトは必ず共通のベーステンプレート（例: `_Layout.html.cshtml`）を継承してください。
- フォントはWebセーフなもの（例: 'Segoe UI', 'Hiragino Sans', Arial, sans-serif）を指定し、全テンプレートで統一してください。
- 余白・パディング・フォントサイズはインラインCSSで明示し、各要素の見た目が崩れないようにしてください。
 - ボタンやリンクはブランドカラー（例: `#0078D4` など）を使い、角丸・影なども統一してください。
- ヘッダー・フッター・署名部分は必ず共通化し、テンプレートごとに差異が出ないようにしてください。
- 画像やロゴは絶対パスではなく、必ずパブリックなURLまたはCID埋め込みで指定してください。
- レスポンシブ対応は最低限（横幅600px固定＋スマホでの折り返し）を意識してください。
- テキストカラー・背景色・リンク色はアクセシビリティを考慮し、コントラスト比を十分に確保してください。
- メール本文の冒頭には必ず宛名や挨拶文を入れ、テンプレートごとに文体がぶれないようにしてください。
- テンプレートのサンプルや共通パーツは `pecus.Libs/Mail/Templates/` にまとめて管理してください。

## 開発ワークフロー
ビルド確認は必須です。変更後はソリューション全体をビルドしてエラーを早期に検出してください。

ビルド例:
```bash
dotnet build pecus.sln
```

アプリ起動例（Aspire 経由）:
```bash
dotnet run --project pecus.AppHost
```

サービス起動順は Aspire の `.WaitFor()` で制御されます。

## よくある作業
- 新しいサービスの追加、共有ライブラリの利用、Hangfire タスクの追加方法など具体的な手順をドキュメントに記載しています（元ファイル参照）。

## コード設計／責務分離の推奨
- 1,000 行を超えるサービスクラスは分割を検討してください。責務ごとにサービスを分けることで可読性とテスト性が向上します。

## アンチパターン（避けるべきこと）
- サービス間の直接参照、環境に依存した接続文字列のハードコーディング、ワークスペースアクセスチェックをスキップすること、など多数のアンチパターンを列挙しています。詳細は元ドキュメントを参照してください。

## 主要ファイル一覧
- `pecus.AppHost/AppHost.cs`
- `pecus.Libs/DB/ApplicationDbContext.cs`
- `pecus.Libs/DB/Seed/DatabaseSeeder.cs`
- `pecus.Libs/Hangfire/Tasks/HangfireTasks.cs`
- `pecus.Libs/Hangfire/Tasks/EmailTasks.cs`
- `pecus.Libs/Mail/Services/EmailService.cs`
- `pecus.Libs/Mail/Services/RazorTemplateService.cs`
- `pecus.ServiceDefaults/Extensions.cs`
- `pecus.WebApi/AppHost.cs`
- `pecus.WebApi/Libs/WorkspaceAccessHelper.cs`
- `pecus.BackFire/AppHost.cs`
- `pecus.DbManager/AppHost.cs`
- `pecus.DbManager/DbInitializer.cs`

## プロジェクト固有の慣習
- エントリポイントは `AppHost.cs` を用いる
- Aspire のリソース名は小文字（`pecusdb`, `redis` 等）
- 共有コードは `pecus.Libs` に置く

## 実装時の確認事項（質問）
- 機能の所有サービスはどれか？（WebApi / BackFire / DbManager）
- 共有ライブラリが必要か？
- バックグラウンド処理にすべきか？
- 環境依存か？
- Aspire の依存設定（DB / Redis など）は何か？
