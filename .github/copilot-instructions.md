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
- **API通信**: OpenAPI/Swagger定義から自動生成されたAxiosベースの型安全なクライアント（`openapi-typescript-codegen`）
- **認証**: pecus.WebApiのJWT認証と連携（トークンは localStorage + httpOnly Cookie）
- **ルーティング**: SPAルーター（Next.jsのApp Router）
- **テスト**: Jest, React Testing Library, Playwright など
- **CI/CD**: GitHub Actions等での自動ビルド・デプロイ

API設計や認証フローは `pecus.WebApi` 側の仕様に厳密に従ってください。アクセストークンの保存・送信方法やエラーハンドリングもセキュリティ要件に合わせて実装します。

開発時は `npm install` → `npm run dev` でローカル開発サーバーを起動し、バックエンドAPIと連携して動作確認を行ってください。

#### APIアクセスルール

**基本方針**: 読み取り操作（Query）と変更操作（Mutation）を分離し、クライアントから `pecus.WebApi` への直接アクセスは禁止

##### 📖 読み取り操作（データ取得）

- **SSR時の初期データ取得（推奨）**: `page.tsx` の Server Component で実行
  - `createPecusApiClients()` でクライアントインスタンスを生成
  - `pecus.WebApi` から直接データ取得
  - Props 経由でクライアントコンポーネントへ参照を渡す
  - マスタデータ（ジャンル、スキル、タグ）、認証情報、ページ初期データ

- **動的なデータ再取得（フィルター変更、ページネーション）**: Next.js API Routes で実行
  - クライアント → `Next.js API Routes` → `pecus.WebApi` の流れ
  - `src/app/api/admin/workspaces/route.ts` など
  - API Routes内で `createPecusApiClients()` を使用して `pecus.WebApi` にアクセス
  - トークンはサーバーサイド（`iron-session`）から自動取得

##### ✏️ 変更操作（データ変更）

- **Server Actions を利用**: `src/actions/` に実装
  - `"use server"` ディレクティブで宣言
  - `createPecusApiClients()` でクライアントインスタンスを生成
  - POST/PUT/DELETE などの変更処理を実行
  - クライアントから `await serverActionName(data)` で呼び出し
  - 例：`await createWorkspace(request)` → Server Action 内で API呼び出し

**Server Actions の設計意図と内部動作**:
- Server Actions はミューテーション（データの作成、更新、削除など）を簡素化することを目的に設計されています
- 内部的には HTTP POST リクエストを使用してサーバーサイドで実行されます
- クライアント側は型安全な関数呼び出しのように使用できますが、実際にはバックグラウンドで POST リクエストが送信されます

##### ❌ 禁止事項

- クライアントコンポーネント内で直接 `pecus.WebApi` にアクセス（トークン露出のリスク）
- Server Actions から `fetch()` で直接 `pecus.WebApi` にアクセス（例：`fetch('http://webapi:5000/...')`）
- クライアント側での `fetch('/api/admin/workspaces')` の多用（初期データはSSR側で取得）

##### 🔄 トークン管理

- Axiosインターセプターが自動的にトークンリフレッシュを処理
- Server Actions と API Routes では `SessionManager.getSession()` からトークンを自動取得
- 明示的なリフレッシュ処理は実装不要

#### API クライアントの自動生成
- **自動生成ファイル**: `src/connectors/api/PecusApiClient.generated.ts` は自動生成されるため、手動で編集しないこと
- **生成スクリプト**: `scripts/generate-pecus-api-client.js` が OpenAPI 定義から API クライアントを生成
- **自動実行**: `npm run dev` / `npm run build` の実行前に自動的に生成スクリプトが実行される（`predev` / `prebuild` フック）
- **手動実行**: 必要に応じて `npm run generate:client` で手動実行可能
- **Git管理**: 自動生成ファイルは `.gitignore` に登録済み

#### アクセストークン管理の設計方針
- **保存場所**:
  - アクセストークンとリフレッシュトークンは両方とも暗号化されたCookieセッション（`iron-session`）に保存
  - セキュリティ: `httpOnly`, `secure`, `sameSite: 'lax'` で保護
- **トークン取得**:
  - `getAccessToken()` Server Action を使用（`src/connectors/api/auth.ts`）
  - SSR専用で、`SessionManager.getSession()` からトークンを取得
- **自動リフレッシュ**:
  - Server Action: `refreshAccessToken()` がリフレッシュ処理を実行
  - Middleware: Next.js Middleware（`src/middleware.ts`）が保護されたルートへのアクセス前にトークン検証
  - fetch使用: Axiosインターセプターの循環呼び出しを防ぐため、リフレッシュAPI呼び出しには直接fetchを使用
- **リフレッシュ条件**:
  - アクセストークンの有効期限が切れている場合
  - Middleware でトークン検証失敗時
  - リフレッシュトークンが有効な場合のみ実行
- **失敗時の処理**:
  - リフレッシュ失敗時（400エラー）はセッションをクリアして `/signin` へリダイレクト
  - その他のエラーはエラーページへ遷移
- **セッション管理**: `SessionManager`クラス（`src/libs/session.ts`）で一元管理

実装サンプルは
- `pecus.Frontend/src/connectors/api/auth.ts`: トークン取得・リフレッシュのServer Actions
- `pecus.Frontend/src/libs/session.ts`: SessionManager（iron-sessionベース）
- `pecus.Frontend/src/middleware.ts`: トークン検証とリフレッシュのMiddleware
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
- **form要素**: `onSubmit` ハンドラーで `event.preventDefault()` を呼び出すか、buttonに `type="button"` を設定してデフォルトの送信動作を防止
- **img要素**: 必ず `alt` 属性を設定してアクセシビリティを確保（装飾画像の場合は `alt=""` で空文字を設定）
- **input要素**:
  - テキスト入力には適切な `type` 属性を設定（`text`, `email`, `password`, `number` など）
  - 必須項目には `required` 属性を設定
  - プレースホルダーは `placeholder` 属性で設定し、ラベルの代替にしない
- **select要素**: デフォルト選択項目には `defaultValue` または `value` を適切に設定
- **アクセシビリティ**:
  - インタラクティブな要素（クリック可能なdivなど）には適切なARIA属性（`role`, `aria-label`）を設定
  - キーボード操作に対応（`tabIndex`, `onKeyDown`）
- **Next.js Image**: 外部画像を使用する場合は `next/image` の `Image` コンポーネントを使用し、`next.config.ts` で `remotePatterns` を設定
- **className**: Tailwind CSS + FlyonUI のクラスを使用し、カスタムCSSは最小限に抑える

#### クライアントサイドバリデーション（Zod）

フロントエンドでの入力検証には **Zod** を使用してください。型安全で宣言的なバリデーションを実現します。

##### バリデーション実装の3層構造

1. **スキーマ定義層** (`src/schemas/`)
   - 再利用可能なZodスキーマを一元管理
   - 共通バリデーションルール（文字数制限、形式チェック等）を定義

   ```typescript
   // src/schemas/filterSchemas.ts
   import { z } from 'zod';

   export const nameFilterSchema = z
     .string()
     .max(100, "検索名は100文字以内で入力してください。")
     .optional();

   export const workspaceNameFilterSchema = nameFilterSchema;
   export const skillNameFilterSchema = nameFilterSchema;
   export const tagNameFilterSchema = nameFilterSchema;
   ```

2. **ユーティリティ層** (`src/utils/validation.ts`)
   - Zodスキーマを使った汎用バリデーション関数
   - 非同期バリデーション対応（refine/transform）
   - エラーメッセージの統一的な抽出

   ```typescript
   // src/utils/validation.ts
   import { z } from "zod";

   export async function validateWithSchema<T>(
     schema: z.ZodSchema<T>,
     data: unknown
   ): Promise<
     | { success: true; data: T; errors?: undefined }
     | { success: false; errors: string[]; data?: undefined }
   > {
     const result = await schema.safeParseAsync(data);

     if (result.success) {
       return { success: true, data: result.data };
     } else {
       return {
         success: false,
         errors: result.error.issues.map(issue => issue.message),
       };
     }
   }
   ```

3. **フック層** (`src/hooks/useValidation.ts`)
   - Reactフック形式でバリデーション状態を管理
   - エラー状態、検証結果、クリア処理を提供

   ```typescript
   // src/hooks/useValidation.ts
   import { useState, useCallback } from 'react';
   import { z } from 'zod';
   import { validateWithSchema } from '@/utils/validation';

   export function useValidation<T>(schema: z.ZodSchema<T>) {
     const [errors, setErrors] = useState<string[]>([]);
     const [isValid, setIsValid] = useState<boolean>(true);

     const validate = useCallback(async (data: unknown) => {
       const result = await validateWithSchema(schema, data);

       if (result.success) {
         setErrors([]);
         setIsValid(true);
         return { success: true as const, data: result.data };
       } else {
         setErrors(result.errors);
         setIsValid(false);
         return { success: false as const, errors: result.errors };
       }
     }, [schema]);

     const clearErrors = useCallback(() => {
       setErrors([]);
       setIsValid(true);
     }, []);

     return {
       validate,      // バリデーション実行関数
       errors,        // エラーメッセージ配列
       isValid,       // バリデーション成功フラグ
       clearErrors,   // エラークリア関数
       error: errors[0],           // 最初のエラー（単一表示用）
       hasErrors: errors.length > 0, // エラー有無フラグ
     };
   }
   ```

##### コンポーネントでの実装パターン

**参考実装**: `pecus.Frontend/src/app/(dashbord)/admin/workspaces/AdminWorkspacesClient.tsx`

```typescript
"use client";

import { useValidation } from "@/hooks/useValidation";
import { workspaceNameFilterSchema } from "@/schemas/filterSchemas";

export default function AdminWorkspacesClient() {
  const [filterName, setFilterName] = useState<string>("");

  // 【1】フックの初期化
  const nameValidation = useValidation(workspaceNameFilterSchema);

  // 【2】リアルタイムバリデーション（入力時）
  const handleNameChange = async (value: string) => {
    setFilterName(value);
    await nameValidation.validate(value);
  };

  // 【3】送信前バリデーション
  const handleSearch = async () => {
    const result = await nameValidation.validate(filterName);
    if (result.success) {
      // バリデーション成功時のみ処理を実行
      handleFilterChange();
    }
  };

  return (
    <div>
      {/* 【4】エラー時のスタイル切り替え */}
      <input
        type="text"
        className={`input input-bordered ${nameValidation.hasErrors ? 'input-error' : ''}`}
        value={filterName}
        onChange={(e) => handleNameChange(e.target.value)}
        onKeyDown={(e) => {
          // 【5】Enterキーでの検証チェック
          if (e.key === 'Enter' && nameValidation.isValid) {
            handleSearch();
          }
        }}
      />

      {/* 【6】エラーメッセージ表示 */}
      {nameValidation.error && (
        <span className="text-error text-sm">{nameValidation.error}</span>
      )}

      {/* 【7】ボタンの有効/無効制御 */}
      <button
        onClick={handleSearch}
        disabled={!nameValidation.isValid}
      >
        検索
      </button>

      {/* 【8】リセット時のエラークリア */}
      <button
        onClick={() => {
          setFilterName("");
          nameValidation.clearErrors();
        }}
      >
        リセット
      </button>
    </div>
  );
}
```

##### 実装の重要ポイント

1. **スキーマの集約**: 共通スキーマは `src/schemas/` で一元管理
2. **非同期対応**: `safeParseAsync` を使用し、refine/transform に対応
3. **型安全性**: TypeScript の型推論を最大限活用
4. **パフォーマンス**: `safeParse` で例外をスローせず効率的に検証
5. **宣言的**: フックでバリデーション状態を管理し、コンポーネントはUIのみに集中
6. **再利用性**: 同じパターンをスキル、タグ、その他のフィルターでも適用可能
7. **エラー表示**: 単一エラー（`error`）と全エラー（`errors`）の両方に対応

##### バリデーションルールの追加例

```typescript
// 複雑なバリデーションルールの例
export const emailSchema = z
  .string()
  .email("有効なメールアドレスを入力してください。")
  .max(255, "メールアドレスは255文字以内で入力してください。");

export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください。")
  .max(100, "パスワードは100文字以内で入力してください。")
  .regex(/[A-Z]/, "パスワードには大文字を含めてください。")
  .regex(/[a-z]/, "パスワードには小文字を含めてください。")
  .regex(/[0-9]/, "パスワードには数字を含めてください。");

// 非同期バリデーション（重複チェック等）
export const usernameSchema = z
  .string()
  .min(3, "ユーザー名は3文字以上で入力してください。")
  .max(50, "ユーザー名は50文字以内で入力してください。")
  .refine(async (val) => {
    const response = await fetch(`/api/check-username?username=${val}`);
    const data = await response.json();
    return !data.exists;
  }, "このユーザー名は既に使用されています。");
```

##### テスト推奨事項

- スキーマ単体のテスト（Vitest/Jest）
- バリデーションフックのテスト（React Testing Library）
- 統合テスト（Playwright/Cypress）


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
3. バックエンド専用処理やサービス間通信は `Controllers/Backend/` に置く（外部公開しない）
4. ログイン・新規登録などは `Controllers/Entrance/` に置く

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

### 内部メソッド引数の設計ルール
**目的**: 同じ型の引数が複数ある場合、呼び出し側での引数の置き間違え（typo）を防止する。

**基本ルール**:
同じ型の引数が2個以上ある場合、**名前付き引数での呼び出しを必須**とする。

**適用対象**:
- `int A, int B, int C` のような複数の int 引数
- `string A, string B, string C` のような複数の string 引数
- `bool A, bool B, bool C` のような複数の bool 引数

**実装パターン**:

```csharp
// ❌ 避けるべき：位置引数だと間違えやすい
public void Process(int userId, int workspaceId, int organizationId)
{
    // ...
}
// 呼び出し側で順序を間違える可能性が高い
Process(123, 456, 789);

// ✅ 推奨：名前付き引数を使用
Process(
    userId: 123,
    workspaceId: 456,
    organizationId: 789
);
```

**具体例**:

```csharp
// 複数の string 引数
public void SendEmail(string to, string subject, string body)
{
    // ...
}
// 呼び出し
SendEmail(
    to: "user@example.com",
    subject: "Welcome",
    body: "Thank you for signing up."
);

// 複数の bool 引数
public void Configure(bool enableLogging, bool enableCache, bool enableDebug)
{
    // ...
}
// 呼び出し
Configure(
    enableLogging: true,
    enableCache: false,
    enableDebug: true
);

// 複数の int 引数
public void UpdateCounts(int totalCount, int activeCount, int inactiveCount)
{
    // ...
}
// 呼び出し
UpdateCounts(
    totalCount: 100,
    activeCount: 80,
    activeCount: 20
);
```

**コードレビュー時のチェックポイント**:
1. 同じ型の引数が2個以上あるメソッドを見つける
2. 呼び出し側で名前付き引数を使用しているか確認
3. 使用していない場合は修正を依頼

**例外**:
- 引数が1個のみの場合は名前付き引数不要
- 型が異なる引数の組み合わせ（例: `int userId, string userName`）は位置引数でも可
- LINQ メソッドなど、一般的な慣用句は例外として認める（例: `Take(10)`, `Skip(5)`）

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

### Entity Framework Core のパフォーマンス最適化

#### デカルト爆発（Cartesian Explosion）の回避

複数の `Include()` を使用する際、デカルト爆発によるパフォーマンス劣化に注意してください。

**問題が発生するパターン:**
```csharp
// ❌ 避けるべき：デカルト爆発が発生
var query = _context.Users
    .Include(u => u.Roles)           // 1:N
    .Include(u => u.UserSkills)      // 1:N
    .Include(u => u.WorkspaceUsers)  // 1:N
    .ToListAsync();
// → Users × Roles × UserSkills × WorkspaceUsers の組み合わせ数のレコードが返る
```

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
   ```csharp
   // ✅ 階層構造の場合はThenInclude()を使用
   var query = _context.Workspaces
       .Include(w => w.WorkspaceUsers)
           .ThenInclude(wu => wu.User)
       .AsSplitQuery()
       .ToListAsync();
   ```

3. **フィルタ付きInclude（EF Core 5.0+）**
   ```csharp
   // ✅ Include内でフィルタリング（SQL側で評価）
   var query = _context.Workspaces
       .Include(w => w.WorkspaceUsers.Where(wu => wu.User.IsActive))
           .ThenInclude(wu => wu.User)
       .AsSplitQuery()
       .ToListAsync();
   ```

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

**避けるべきパターン:**

```csharp
// ❌ 避けるべき：複雑なネストLINQはクライアント評価される可能性
query = query.Where(u =>
    skillIds.All(skillId => u.UserSkills.Any(us => us.SkillId == skillId))
);
// → CountAsync()とToListAsync()で異なる結果になる可能性

// ✅ 推奨：foreachで分解してSQL側で評価
foreach (var skillId in skillIds) {
    var currentSkillId = skillId; // クロージャ対策
    query = query.Where(u => u.UserSkills.Any(us => us.SkillId == currentSkillId));
}
```

#### グローバル設定（推奨しない）

プロジェクト全体で `AsSplitQuery()` をデフォルトにすることも可能ですが、個別に制御する方が推奨されます。

```csharp
// ⚠️ グローバル設定（非推奨）
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
}
```

#### ベストプラクティスまとめ

1. **複数の Include() がある場合は必ず `AsSplitQuery()` を使用**
2. **ページネーションでは CountAsync() の前に全フィルタ条件を適用**
3. **複雑なネストLINQ（`All()`, `Any()` の組み合わせ）は分解してSQL側で評価**
4. **フィルタ付きInclude を活用してデータ取得量を最小化**
5. **コメントで意図を明記**（例: `// デカルト爆発防止`）

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
 - ボタンやリンクはブランドカラー（例: `# 0078D4` など）を使い、角丸・影なども統一してください。
- ヘッダー・フッター・署名部分は必ず共通化し、テンプレートごとに差異が出ないようにしてください。
- 画像やロゴは絶対パスではなく、必ずパブリックなURLまたはCID埋め込みで指定してください。
- レスポンシブ対応は最低限（横幅600px固定＋スマホでの折り返し）を意識してください。
- テキストカラー・背景色・リンク色はアクセシビリティを考慮し、コントラスト比を十分に確保してください。
- メール本文の冒頭には必ず宛名や挨拶文を入れ、テンプレートごとに文体がぶれないようにしてください。
- テンプレートのサンプルや共通パーツは `pecus.Libs/Mail/Templates/` にまとめて管理してください。

## 開発ワークフロー
ビルド確認は必須です。変更後はソリューション全体をビルドしてエラーを早期に検出してください。

コードフォーマット例（.editorconfigに基づく自動整形）:
```bash
dotnet format pecus.sln
```

ビルド例:
```bash
dotnet build pecus.sln
```

推奨フロー:
```bash
# 1. コードフォーマット実行
dotnet format pecus.sln

# 2. ビルド確認
dotnet build pecus.sln

# 3. アプリ起動
dotnet run --project pecus.AppHost
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
