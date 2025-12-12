# フロントエンド開発ガイドライン

## 1. アーキテクチャ概要

`pecus.Frontend` は Next.js（React）+ TypeScript によるSPA/Web UI拡張用ディレクトリです。主なアーキテクチャ方針は以下の通りです。

- **フレームワーク**: React（Next.js）
- **型安全**: TypeScript
- **状態管理**: jotai
- **UIライブラリ**: Tailwind CSS + FlyonUI
- **API通信**: OpenAPI/Swagger定義から自動生成された型安全なクライアント（`openapi-typescript-codegen`）
- **認証**: pecus.WebApiのJWT認証と連携（Redis ベースのサーバーサイドセッション、Cookie には sessionId のみ保存）
- **ルーティング**: SPAルーター（Next.jsのApp Router）
- **テスト**: Jest, React Testing Library, Playwright など
- **CI/CD**: GitHub Actions等での自動ビルド・デプロイ

API設計や認証フローは `pecus.WebApi` 側の仕様に厳密に従ってください。アクセストークンの保存・送信方法やエラーハンドリングもセキュリティ要件に合わせて実装します。

## 2. APIアクセスルール

**基本方針**: 読み取り操作（Query）と変更操作（Mutation）を分離し、クライアントから `pecus.WebApi` への直接アクセスは禁止

### 許可/禁止マトリクス（要点）
- SSR（Server Component）: 許可（`createPecusApiClients()` 経由・`ServerSessionManager`でトークン取得）
- Server Actions: 許可（`createPecusApiClients()` 経由）。`fetch('http://webapi...')` は禁止
- Next.js API Routes: 許可（`createPecusApiClients()` 経由・サーバー側で実行）
- クライアントコンポーネント: 直接呼び出し禁止（Server Actions / API Routes を経由）
- ブラウザからWebApi直叩き: 禁止（トークン露出防止・監査性確保）
- Next.js Middleware: sessionId の存在チェックのみ（Redis アクセスなし、Edge Runtime 対応）

### 📖 読み取り操作（データ取得）

- **SSR時の初期データ取得（推奨）**: `page.tsx` の Server Component で実行
  - `createPecusApiClients()` でクライアントインスタンスを生成
  - `pecus.WebApi` から直接データ取得
  - Props 経由でクライアントコンポーネントへ参照を渡す
  - マスタデータ（ジャンル、スキル、タグ）、認証情報、ページ初期データ

- **動的なデータ再取得（フィルター変更、ページネーション）**: Next.js API Routes で実行
  - クライアント → `Next.js API Routes` → `pecus.WebApi` の流れ
  - `src/app/api/admin/workspaces/route.ts` など
  - API Routes内で `createPecusApiClients()` を使用して `pecus.WebApi` にアクセス
    - トークンはサーバーサイドの `ServerSessionManager`（`pecus.Frontend/src/libs/serverSession.ts`、Redis から自動取得）から取得

### ✏️ 変更操作（データ変更）

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

### ❌ 禁止事項

- クライアントコンポーネント内で直接 `pecus.WebApi` にアクセス（トークン露出のリスク）
- Server Actions/SSR から `fetch()` で `pecus.WebApi` を直接呼び出す（例：`fetch('http://webapi:5000/...)`）。例外: トークンリフレッシュ API のみ循環回避のため直 `fetch` を許可。
- クライアント側での `fetch('/api/admin/workspaces')` の多用（初期データはSSR側で取得）

### 🔄 トークン管理

- **OpenAPI グローバル設定**: `createPecusApiClients()` が OpenAPI の `TOKEN` プロパティに `getAccessToken()` を設定（自動トークン付与）
- **Server Actions/API Routes**: `createPecusApiClients()` の呼び出しで自動的にトークンが取得・付与される
- **トークンリフレッシュ**: `getAccessToken()` 呼び出し時に `ServerSessionManager.getValidAccessToken()` が有効期限をチェックし、必要に応じて自動リフレッシュを実行

## 3. API クライアントの自動生成

- **自動生成ファイル**: `src/connectors/api/PecusApiClient.generated.ts` は自動生成されるため、手動で編集しないこと
- **生成スクリプト**: `scripts/generate-pecus-api-client.js` が `src/connectors/api/pecus/services/` 内のサービスクラスをスキャンして、`createApiClientInstances()` ファクトリ関数と `configureOpenAPI()` 設定関数を生成
- **自動実行**: `npm run dev` / `npm run build` の実行前に自動的に生成スクリプトが実行される（`predev` / `prebuild` フック）
- **手動実行**: 必要に応じて `npm run generate:client` で手動実行可能
- **生成内容**: `createApiClientInstances()` はすべてのサービスクラスを返すファクトリ関数。`createPecusApiClients()` はこれを呼び出して OpenAPI 設定を行い、設定済みのサービスインスタンスを返す（`src/connectors/api/PecusApiClient.ts` で定義）
- **Git管理**: 自動生成ファイルは `.gitignore` に登録済み
 - **編集可/不可のSSoT**: 編集可: `src/connectors/api/PecusApiClient.ts`（トークン取得・OpenAPI 設定ロジック）／編集不可: `src/connectors/api/PecusApiClient.generated.ts`（サービスインスタンス定義）／型の参照: `src/connectors/api/pecus/index.ts`（自動生成エクスポート）

## 4. アクセストークン管理の設計方針

> 詳細は `docs/auth-architecture-redesign.md` を参照

### 保存場所

| 情報 | 保存場所 | 備考 |
|------|----------|------|
| sessionId | Cookie（`httpOnly: true`, `sameSite: 'strict'`） | ブラウザに残るのはこれのみ |
| accessToken | Redis（Next.js サーバー側） | ブラウザには送信しない |
| refreshToken | Redis（Next.js サーバー側） | ブラウザには送信しない |
| user/device 情報 | Redis（Next.js サーバー側） | セッションデータとして保持 |

### セキュリティ特性

- **XSS 耐性**: トークンがブラウザに存在しないため、XSS でトークンを盗まれるリスクがない
- **ネットカフェ対策**: 端末にトークンが残らない（sessionId のみ、httpOnly で保護）
- **即時無効化**: Redis からセッションを削除するだけで即座にログアウト可能

### トークン取得フロー

1. Server Actions / API Routes で `getAccessToken()` を呼び出し
2. `ServerSessionManager.getValidAccessToken()` が Redis からセッションを取得
3. アクセストークンの有効期限をチェック（5分のバッファ）
4. 期限切れ間近なら `ServerSessionManager.refreshTokens()` で自動リフレッシュ
5. 有効なアクセストークンを返す

### 自動リフレッシュ

- **トリガー**: `getAccessToken()` 呼び出し時に有効期限が5分未満の場合
- **処理**: `ServerSessionManager.refreshTokens()` が WebAPI の `/api/entrance/refresh` を呼び出し
- **更新**: Redis 上のセッションデータを更新（Cookie の sessionId は変更なし）

### 失敗時の処理

- リフレッシュ失敗時: Redis セッションを削除、Cookie をクリア、ログインページへリダイレクト
- セッション期限切れ: Middleware が sessionId 不在を検知してログインページへリダイレクト

### Middleware の役割

- sessionId Cookie の存在チェックのみ（Edge Runtime 対応）
- Redis アクセスは行わない（Server Components / Server Actions に委譲）
- 旧形式の Cookie（accessToken, refreshToken, user, device）を検出した場合は削除してログインページへリダイレクト

### セッション管理

- **クラス**: `ServerSessionManager`（`src/libs/serverSession.ts`）
- **ストレージ**: Redis（キー: `frontend:session:{sessionId}`）
- **TTL**: 最大30日（スライディングセッション、非アクティブ7日で期限切れ）

### 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/libs/serverSession.ts` | `ServerSessionManager` - Redis ベースのセッション管理（メイン） |
| `src/libs/session.ts` | 互換レイヤー（非推奨、ServerSessionManager に委譲） |
| `src/connectors/api/auth.ts` | トークン取得・リフレッシュの Server Actions |
| `src/middleware.ts` | sessionId 存在チェック（Edge Runtime 対応） |
| `src/actions/auth.ts` | ログイン・ログアウトの Server Actions |
| `src/connectors/api/PecusApiClient.ts` | API クライアント設定（手動編集可能） |
| `src/connectors/api/PecusApiClient.generated.ts` | API クライアント生成部分（自動生成） |

## 5. Next.js 実装ガイド

### Next.js 固有の注意事項
- **動的レンダリング**: キャッシュ戦略に応じて必要な場合のみ `export const dynamic = 'force-dynamic'` を設定（常時必須ではない）
- **エラーハンドリング**: try-catch で API エラーを適切にハンドリングし、ユーザーにフィードバックを提供
- **ローディング状態**: データフェッチ中は適切なローディングインジケーターを表示
- **環境変数**: pecus.WebApiのベース URL は `process.env.API_BASE_URL`で管理
- **Server Actions**: SSR でのデータ取得には Server Actions（`src/actions/`）を使用
- **クライアントコンポーネント**: インタラクティブな機能には `"use client"` ディレクティブを付与

### SSR（サーバーサイドレンダリング）アーキテクチャ

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

### ページネーション実装
- **共通コンポーネント**: `src/components/common/Pagination.tsx` を使用
- **ライブラリ**: `react-paginate` を使用し、FlyonUI スタイルで統一
- **ページ番号**: サーバー側は 1-based、`react-paginate` は 0-based のため変換が必要
- **スタイリング**: `gap-0.5` でボタン間に適度な間隔を設定
- **条件表示**: `totalPages <= 1` の場合は自動的に非表示


### HTML生成ルール
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

## 6. クライアントサイドバリデーション（Zod）

フロントエンドでの入力検証には **Zod** を使用してください。型安全で宣言的なバリデーションを実現します。

### バリデーション実装の3層構造

1. **スキーマ定義層** (`src/schemas/`)
   - 再利用可能なZodスキーマを一元管理
   - 共通バリデーションルール（文字数制限、形式チェック等）を定義
   - 型推論により TypeScript で自動的に型安全性を確保

2. **ユーティリティ層** (`src/utils/validation.ts`)
   - Zodスキーマを使った汎用バリデーション関数
   - 非同期バリデーション対応（refine/transform）
   - エラーメッセージの統一的な抽出

3. **フック層** - 用途により2つのフックを使い分ける

   **3-1. 個別フィールドバリデーション用 (`src/hooks/useValidation.ts`)**
   - リアルタイムバリデーション（入力時）に最適
   - 単一フィールド or フィールド単位の検証に使用
   - 検索条件フィルター、インラインバリデーションなど

   **3-2. フォーム全体バリデーション用 (`src/hooks/useFormValidation.ts`)**
   - フォーム送信時の包括的なバリデーション
   - フィールド単位のエラー管理・表示
   - Server Actions への連携
   - 複数フィールドの入力時検証と送信時検証

### フォーム認証の実装パターン

フォーム送信には **Server Actions と Zod バリデーションを組み合わせた以下のパターン** を採用してください。

**【基本フロー】**
1. クライアント側で `useValidation` フックでリアルタイムバリデーション
2. 送信時にサーバーサイド検証を再実行
3. 検証成功後に API 呼び出し
4. 成功時は `redirect()` でリダイレクト、失敗時はエラーメッセージを返す

**【実装のポイント】**

1. **スキーマ定義**: 再利用可能なスキーマを `src/schemas/` に配置
2. **Server Action**: `src/actions/` にサーバーサイド処理を集約
3. **二重検証**: クライアント検証（UX）+ サーバー検証（セキュリティ）
4. **エラーハンドリング**: Zod エラーと API エラーを区別して処理
5. **ローディング状態**: 送信中はボタンを disabled にして多重送信を防止
6. **リダイレクト**: 成功時は Server Action 内で `redirect()` を実行
7. **フォーム値**:
   - 必須項目は `required` 属性を付与
   - 入力補助（自動小文字化など）はクライアント側で実施
   - 選択系要素は初期値を明示的に設定

**【禁止事項】**

- ❌ Server Action から直接 `fetch()` で API 呼び出し（代わりに `createPecusApiClients()` を使用）
- ❌ クライアントコンポーネント内で API エラーハンドリング（Server Action で集約）
- ❌ サーバーエラーメッセージをそのまま表示（ユーザーフレンドリーなメッセージに変換）
- ❌ 複数フォーム送信を許可（isLoading で防止）

## 7. エラーハンドリング統一方針

### Server Actions と WebAPI のレスポンス型

Server Action が Next.js クライアントに返す共通戻り値型は下記 `ApiResponse<T>` を使用します。`T` は WebAPI（自動生成クライアント）が返すレスポンスの型です。

```typescript
export type ApiResponse<T> =
  | { success: true; data: T }
  | ConflictResponse<T>
  | ErrorResponse;
```

- `ConflictResponse<T>`: 並行更新（HTTP 409）を表す型。最新のデータを含めて返却することでクライアント側で再取得・マージ処理を行えるようにします（フロントエンドの `detectConcurrencyError` ヘルパーを参照）。
- `ErrorResponse`: バリデーションやサーバーエラーを表す汎用エラー型。自動生成クライアントの `services/*` の返り値パターンに合わせてください。

実装ガイドライン（要点）:

1. Server Action の戻り型は常に `Promise<ApiResponse<T>>` を採用する（`T` は `pecus.Frontend/src/connectors/api/pecus/index.ts` の型）。
2. API 呼び出しは `createPecusApiClients()` を使う（直接 `fetch()` を叩かないこと）。
3. エラー処理:
   - 409（Concurrency）は `detectConcurrencyError(error)` を使って `ConflictResponse<T>` を返す。
   - その他の API エラーは `ErrorResponse` を返す（`error.body?.message` 等を利用してメッセージを整形）。
4. 成功時は `{ success: true, data: response }` を返す。

### Server Actions のエラーレスポンス（`src/actions/`）

Server Actions は統一されたエラーレスポンス形式を返します。ヘルパー関数は `src/actions/types.ts` に定義されています。

**エラー型定義**:
```typescript
export type ErrorResponse = {
  success: false;
  error: 'validation' | 'server' | 'not_found' | 'forbidden';
  message: string;
};
```

**ヘルパー関数**:
| 関数 | 用途 | エラータイプ |
|------|------|-------------|
| `validationError<T>(message)` | 入力値バリデーションエラー | `validation` |
| `serverError<T>(message)` | API レスポンスエラー（非例外） | `server` |
| `notFoundError<T>(message)` | リソースが見つからない | `not_found` |
| `forbiddenError<T>(message)` | 権限不足 | `forbidden` |
| `parseErrorResponse<T>(error, defaultMessage)` | catch で捕捉した例外を解析 | 状況による |

### API ルーターのエラーレスポンス（`src/app/api/`）

API ルーターは統一されたエラーレスポンス形式を返します。ヘルパー関数は `src/app/api/routerError.ts` に定義されています。

**エラー型定義**:
```typescript
export type RouterErrorType = {
  error: string;
  status: number;
};
```

### 通知の使い分け（`useNotify` フック）

`src/hooks/useNotify.ts` の `error()` メソッドは第2引数で永続表示を制御できます。

**使い分けガイドライン**:
| エラー種別 | `persistent` | 理由 |
|-----------|--------------|------|
| 通信エラー（fetch 失敗） | `true` | ユーザーがネットワーク状況を確認する必要がある |
| バリデーションエラー | `false` | 入力を修正すれば解決するため、すぐ消えて良い |
| Server Actions のエラー | `false` | 一時的なエラーが多く、再試行で解決することが多い |
| 重大なエラー（データ消失等） | `true` | ユーザーに確実に認識させたい場合 |

### 条件付きユニオン型（Discriminated Union）の扱い方

`ApiResponse<T>` のような条件付きユニオン型を扱う際は、**Early Return（ガード節）パターン**を使用してください。

**✅ 推奨: Early Return パターン**
```typescript
const result = await fetchData();

// エラーケースを先にチェックして早期リターン
if (!result.success) {
  setError(result.message);
  return;
}

// ここで result.success === true が確定、result.data に安全にアクセス可能
const data = result.data;
doSomething(data);
```

**❌ 禁止: else if で終わる構文**
```typescript
// 可読性が低く、型のナローイングも不自然
if (result.success) {
  // 正常系
} else if (!result.success) {
  // エラー系（else if で終わるのは避ける）
}
```

**❌ 禁止: 型アサーション**
```typescript
// 型安全性が失われる
const data = (result as SuccessResponse).data;
```

**理由**:
- Early Return により、正常系のコードがフラットに読める
- TypeScript の型ナローイングが自然に機能する
- `else if` で終わる構文は可読性が低く、意図が不明確になる
