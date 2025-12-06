# Middleware認証アーキテクチャ

## 概要

Next.js Middlewareを利用した認証システムにより、SSR（サーバーサイドレンダリング）とCSR（クライアントサイドレンダリング）の両方で一貫した認証管理を実現しています。

## アーキテクチャ概念図

```
┌─────────────────────────────────────────────────────────────┐
│                    ユーザーリクエスト                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Middleware (SSR)                          │
│  - トークン有効期限チェック（jwt-decode）                      │
│  - 5分未満なら自動リフレッシュ                                 │
│  - 失敗時はログインページへリダイレクト                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               Server Component / Page                       │
│  - Server Actionsを呼び出してデータ取得                        │
│  - Middlewareが認証済みなので401エラーは発生しない               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            Client Component (CSR)                           │
│  - ユーザーアクション（ボタンクリックなど）                       │
│  - OpenAPI グローバル設定で自動トークン付与                      │
└─────────────────────────────────────────────────────────────┘
```

## 責務分離

### Middleware（`src/middleware.ts`）

**役割**: SSRコンテキストでの認証管理

- **実行タイミング**: 全ページアクセス前（サーバーコンポーネントのレンダリング前）
- **処理内容**:
  1. クッキーからアクセストークンを取得
  2. `jwt-decode`でトークンの有効期限をチェック
  3. 有効期限が5分未満の場合、自動的にトークンリフレッシュを実行
  4. 新しいトークンをクッキーに設定
  5. リフレッシュ失敗時はログインページへリダイレクト

**公開パス**: `/signin`, `/signup`, `/forgot-password`, `/reset-password`は認証不要

**スキップパス**: `/_next`, `/api`, 静的ファイル（`.`を含むパス）

```typescript
// middleware.ts の主要ロジック
const decoded: any = jwtDecode(accessToken);
const now = Math.floor(Date.now() / 1000);
const expiresIn = decoded.exp - now;

if (expiresIn > 300) {
  // 5分以上残っている → そのまま通過
  return NextResponse.next();
}

// 5分未満 → リフレッシュ実行
const refreshResponse = await fetch(`${apiBaseUrl}/api/entrance/refresh`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken }),
});

// 新しいトークンをクッキーに設定して続行
response.cookies.set('accessToken', data.accessToken, { ... });
response.cookies.set('refreshToken', data.refreshToken, { ... });
```

### OpenAPI グローバル設定（`src/connectors/api/PecusApiClient.ts`）

**役割**: Server Actions / API Routes / SSR での認証管理

- **実行タイミング**: `createPecusApiClients()` が呼び出される時点
- **処理内容**:
  1. OpenAPI グローバルオブジェクトの `TOKEN` プロパティに `getAccessToken()` を登録
  2. すべての API リクエストが自動的にトークンを付与
  3. Middleware で事前にリフレッシュされているため、通常は 401 エラーは発生しない

**実装例**:

```typescript
// PecusApiClient.ts の主要ロジック
export function createPecusApiClients() {
  configureOpenAPI(
    process.env.API_BASE_URL || "https://localhost:7265",
    async () => {
      const token = await getAccessToken();
      return token ?? undefined;
    }
  );

  return createApiClientInstances();
}
```

**トークン取得方式**:
- Server Actions / API Routes: `SessionManager.getSession()` から Cookie 取得
- SSR: Middleware で事前リフレッシュ済み

**重要な特徴**:
- 同期的に呼び出し可能（`await` 不要）
- リクエストごとに新しい設定が適用される
- リフレッシュ処理は Middleware に一元化

## トークンリフレッシュフロー

### SSRフロー（Middlewareが処理）

```
User Request → Middleware → トークン検証 → リフレッシュ（必要なら） → Page Rendering
                                ↓ 失敗
                           /signin へリダイレクト
```

### Server Actions / API Routesフロー（自動付与）

```
Server Action Call → createPecusApiClients() → トークン自動付与 → API Call
```

Middleware で事前にリフレッシュされているため、通常は 401 エラーは発生しません。

## Server Actionsの実装パターン

### 基本パターン（Middleware対応後）

```typescript
'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { ApiResponse } from './types';

export async function getOrganization(): Promise<ApiResponse<any>> {
  try {
    // enableRefreshは指定不要（デフォルトtrue）
    // Middlewareが事前に認証チェックを行うため、401エラーは発生しない
    const api = createPecusApiClients();
    const response = await api.adminOrganization.apiAdminOrganizationGet();
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to fetch organization:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch organization'
    };
  }
}
```

### ページコンポーネントでの使用

```tsx
// SSRページ - Middlewareが認証済み
export default async function AdminPage() {
  const [orgResult, userResult] = await Promise.all([
    getOrganization(),
    getCurrentUser(),
  ]);

  // Middlewareが認証チェック済みなので、401エラーハンドリングは不要
  // エラー時は通常のエラー表示のみ
  if (!orgResult.success) {
    return <div>エラー: {orgResult.error}</div>;
  }

  return <AdminClient organization={orgResult.data} />;
}
```

## 環境変数

```env
# .env
API_BASE_URL=https://localhost:7265
NODE_TLS_REJECT_UNAUTHORIZED=0  # 開発環境のみ
```

## セキュリティ考慮事項

1. **トークンの保存先**: クッキー（`httpOnly: false`）
   - Server Actions / API Routes で `createPecusApiClients()` により自動付与
   - `sameSite: 'strict'`でCSRF対策
   - 本番環境では`secure: true`でHTTPS必須

2. **リフレッシュタイミング**: 有効期限5分前
   - UX向上（突然のログアウトを防止）
   - サーバー負荷軽減（頻繁なリフレッシュを回避）

3. **エラーハンドリング**:
   - Middleware: トークンデコード失敗 → クッキークリア → /signinへリダイレクト
   - リフレッシュ失敗: クライアント側でセッション終了 → /signinへリダイレクト

4. **自動トークン付与**: OpenAPI グローバル設定で、すべての API リクエストに自動的にトークンが付与される

## トラブルシューティング

### 症状: ログインループ

**原因**: Middlewareがログインページでもトークンをチェックしている

**解決策**: `publicPaths`に該当パスが含まれているか確認

```typescript
const publicPaths = ['/signin', '/signup', '/forgot-password', '/reset-password'];
```

### 症状: SSRで401エラー

**原因**: Middlewareが正しく動作していない

**解決策**:
1. `middleware.ts`の`matcher`設定を確認
2. ブラウザの開発者ツールでクッキーが設定されているか確認
3. サーバーログで`[Middleware]`プレフィックスのログを確認

### 症状: Server Actions でトークンが付与されない

**原因**: `createPecusApiClients()` が呼ばれていない

**解決策**:
1. Server Action 内で `createPecusApiClients()` を呼び出しているか確認
2. `getAccessToken()` が正しくトークンを取得しているか確認
3. `SessionManager` または `cookies()` からクッキーが取得できているか確認
3. ブラウザコンソールで`[PecusApiClient]`ログを確認

## パフォーマンス最適化

1. **Middlewareの最適化**:
   - 静的リソース（`/_next/static`, `/_next/image`, `favicon.ico`）はスキップ
   - API Routes（`/api`）はスキップ（別途認証を持つため）
   - トークンデコードのみ（署名検証なし）で高速化

2. **Axiosインターセプターの最適化**:
   - インスタンスレベルの`refreshPromise`でリフレッシュを1回だけ実行
   - Server Actionの動的インポートでバンドルサイズを削減
   - クライアントサイドでのみインターセプターを有効化（SSRでは無駄な処理を避ける）

## まとめ

- **Middleware**: SSRでの認証を担当、ページレンダリング前にトークンを検証・リフレッシュ
- **Axios**: CSRでの認証を担当、動的API呼び出し時にトークンを検証・リフレッシュ
- **Server Actions**: 認証済みを前提に動作、シンプルなエラーハンドリングのみ
- **明確な責務分離**: Middlewareが主、Axiosが補完的な役割
