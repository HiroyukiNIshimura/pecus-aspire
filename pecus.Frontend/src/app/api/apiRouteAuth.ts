import { cookies } from 'next/headers';
import { SessionManager } from '@/libs/session';

/**
 * API Route 用のアクセストークン確保ヘルパー
 *
 * アクセストークンを取得し、存在しない場合はリフレッシュトークンを使って
 * 新しいアクセストークンの取得を試みます。
 *
 * 注意: このファイルには "use server" ディレクティブを付けないこと。
 * Route Handler から呼び出す際に、同じリクエストコンテキストで
 * Cookie にアクセスする必要があるため。
 *
 * @returns アクセストークン、または null（リフレッシュも失敗した場合）
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const token = await ensureAccessToken();
 *   if (!token) {
 *     return unauthorizedError('認証が必要です。再ログインしてください。');
 *   }
 *   // ... API 呼び出し
 * }
 * ```
 */
export async function ensureAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // アクセストークンを直接取得
    const accessToken = cookieStore.get('accessToken')?.value;
    if (accessToken) {
      return accessToken;
    }

    // リフレッシュトークンを直接取得
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (!refreshToken) {
      console.warn('[API Route] No access token or refresh token available');
      return null;
    }

    // ユーザー情報を取得（セッション更新時に必要）
    const userStr = cookieStore.get('user')?.value;
    const deviceStr = cookieStore.get('device')?.value;
    
    let user = null;
    let device = null;
    try {
      if (userStr) user = JSON.parse(userStr);
      if (deviceStr) device = JSON.parse(deviceStr);
    } catch {
      // パースエラーは無視
    }

    console.log('[API Route] Access token missing, attempting refresh...');
    
    // WebAPIのリフレッシュエンドポイントを直接呼び出す
    const apiBaseUrl = process.env.API_BASE_URL || 'https://localhost:7265';
    const response = await fetch(`${apiBaseUrl}/api/entrance/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.error('[API Route] Refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[API Route] Token refresh successful');

    // セッションを更新
    if (user) {
      try {
        await SessionManager.setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessExpiresAt: data.expiresAt,
          refreshExpiresAt: data.refreshExpiresAt,
          user,
          device,
        });
        console.log('[API Route] Session updated');
      } catch (sessionError) {
        console.warn('[API Route] Could not update session cookies:', sessionError);
        // セッション更新に失敗しても、取得したトークンは返す
      }
    }

    return data.accessToken;
  } catch (error) {
    console.error('[API Route] ensureAccessToken error:', error);
    return null;
  }
}
