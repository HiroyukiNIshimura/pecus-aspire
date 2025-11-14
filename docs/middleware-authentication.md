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
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          Axios Interceptor (CSR only)                       │
│  - 401エラー検出                                              │
│  - リフレッシュAPIを fetch 直呼び出し（循環回避）               │
│  - リクエスト再試行                                            │
│  - 失敗時はログインページへリダイレクト                          │
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

### Axiosインターセプター（`src/connectors/api/PecusApiClient.ts`）

**役割**: CSRコンテキストでの認証管理

- **実行タイミング**: クライアントサイドでのAPI呼び出し時（動的アクションやボタンクリックなど）
- **処理内容**:
  1. レスポンスで401エラーを検出
  2. `www-authenticate`ヘッダーで`invalid_token`を確認
  3. リフレッシュ API を `fetch` で直呼び出し（インターセプターの循環回避）
  4. 新しいトークンでリクエストを再試行
  5. リフレッシュ失敗時はログインページへリダイレクト

**重要な制約**: `typeof window !== 'undefined'`チェックにより、クライアントサイドでのみインターセプターを有効化

```typescript
// PecusApiClient.ts の主要ロジック（CSRのみ）
if (enableRefresh && typeof window !== 'undefined') {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const isTokenExpired = /* 401 + invalid_token チェック */;

      if (isTokenExpired && !originalRequest[RETRY_FLAG]) {
        // インターセプター循環を避けるため、fetch でリフレッシュAPIを直呼び出し
        const res = await fetch('/api/entrance/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: getRefreshToken() })
        });
        if (!res.ok) {
          throw new Error('refresh failed');
        }
        const result = await res.json();

        // 新しいトークンで再試行
        originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
        return instance(originalRequest);
      }

      return Promise.reject(error);
    }
  );
}
```

注意:
- CSR のリフレッシュのみ `fetch` 直呼び出しを許可します。それ以外の API 呼び出しは `createPecusApiClients()` 経由（SSR/SA）または通常の Axios（CSR）を使用し、WebApi 直 `fetch` は禁止です。

## トークンリフレッシュフロー

### SSRフロー（Middlewareが処理）

```
User Request → Middleware → トークン検証 → リフレッシュ（必要なら） → Page Rendering
                                ↓ 失敗
                           /signin へリダイレクト
```

### CSRフロー（Axiosが処理）

```
Button Click → API Call → 401 Error → Axios Interceptor → Server Action → Refresh
                                                                  ↓ 成功
                                                            Retry Request
                                                                  ↓ 失敗
                                                          /signin へリダイレクト
```

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
   - クライアントサイドでもアクセス可能（Axios interceptorで使用）
   - `sameSite: 'strict'`でCSRF対策
   - 本番環境では`secure: true`でHTTPS必須

2. **リフレッシュタイミング**: 有効期限5分前
   - UX向上（突然のログアウトを防止）
   - サーバー負荷軽減（頻繁なリフレッシュを回避）

3. **エラーハンドリング**:
   - Middleware: トークンデコード失敗 → クッキークリア → /signinへリダイレクト
   - Axios: リフレッシュ失敗 → クライアント側で/signinへリダイレクト

4. **競合制御**: インスタンスレベルの`refreshPromise`で複数リクエストの同時リフレッシュを防止

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

### 症状: CSRでトークンリフレッシュが動作しない

**原因**: Axiosインターセプターが登録されていない

**解決策**:
1. `createPecusApiClients()`が`enableRefresh=true`（デフォルト）で呼ばれているか確認
2. クライアントコンポーネント（`'use client'`）から呼ばれているか確認
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
