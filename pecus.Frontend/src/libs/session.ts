import { cookies } from 'next/headers';

export type SessionData = {
  accessToken: string;
  refreshToken: string;
  /** アクセストークンの有効期限（ISO文字列）。クッキー寿命計算に利用 */
  accessExpiresAt?: string;
  /** リフレッシュトークンの有効期限（ISO文字列）。クッキー寿命計算に利用 */
  refreshExpiresAt?: string;
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };
  device?: {
    name?: string;
    type?: string;
    os?: string;
    userAgent?: string;
    appVersion?: string;
    timezone?: string;
    location?: string;
    ipAddress?: string;
  };
};

export class SessionManager {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_KEY = 'user';

  // セッション取得（SSR専用）
  static async getSession(): Promise<SessionData | null> {
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get(SessionManager.ACCESS_TOKEN_KEY)?.value;
      const refreshToken = cookieStore.get(SessionManager.REFRESH_TOKEN_KEY)?.value;
      const userStr = cookieStore.get(SessionManager.USER_KEY)?.value;

      if (!accessToken || !refreshToken || !userStr) {
        console.log('Server  Session incomplete:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUser: !!userStr,
        });
        return null;
      }

      try {
        const user = JSON.parse(userStr);
        return { accessToken, refreshToken, user };
      } catch (parseError) {
        console.error('Server  Failed to parse user data:', parseError);
        return null;
      }
    } catch (error) {
      console.error('Server  Failed to get session:', error);
      return null;
    }
  }

  // セッション保存（Route Handler専用）
  // 注意: サーバーコンポーネントからは呼び出さないこと
  static async setSession(data: SessionData): Promise<void> {
    try {
      const cookieStore = await cookies();
      const userString = JSON.stringify(data.user);

      // ExpiresAt は UTC の ISO 文字列を想定
      const toMaxAgeSeconds = (expiresAt?: string, fallbackSeconds: number = 60 * 60 * 24 * 30) => {
        if (!expiresAt) return fallbackSeconds;
        const expiresMs = Date.parse(expiresAt);
        if (Number.isNaN(expiresMs)) return fallbackSeconds;

        const diffSeconds = Math.floor((expiresMs - Date.now()) / 1000);
        return diffSeconds > 0 ? diffSeconds : fallbackSeconds;
      };

      const accessMaxAge = toMaxAgeSeconds(data.accessExpiresAt, 60 * 60); // デフォルト1時間
      const refreshMaxAge = toMaxAgeSeconds(data.refreshExpiresAt, 60 * 60 * 24 * 30); // デフォルト30日

      const baseCookieOptions = {
        path: '/',
        httpOnly: false,
        sameSite: 'strict' as const,
        secure: process.env.NODE_ENV === 'production', // 本番環境でのみHTTPS必須
      };

      cookieStore.set(SessionManager.ACCESS_TOKEN_KEY, data.accessToken, {
        ...baseCookieOptions,
        maxAge: accessMaxAge,
      });

      cookieStore.set(SessionManager.REFRESH_TOKEN_KEY, data.refreshToken, {
        ...baseCookieOptions,
        maxAge: refreshMaxAge,
      });

      // user クッキーはリフレッシュトークンと同じ寿命に合わせる
      cookieStore.set(SessionManager.USER_KEY, userString, {
        ...baseCookieOptions,
        maxAge: refreshMaxAge,
      });

      console.log('Server  Session saved successfully');
    } catch (error) {
      console.error('Server  Failed to set session:', error);
      throw error;
    }
  }

  // セッションクリア（Route Handler専用）
  static async clearSession(): Promise<void> {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(SessionManager.ACCESS_TOKEN_KEY);
      cookieStore.delete(SessionManager.REFRESH_TOKEN_KEY);
      cookieStore.delete(SessionManager.USER_KEY);
      console.log('Server  Session cleared');
    } catch (error) {
      console.error('Server  Failed to clear session:', error);
      throw error;
    }
  }

  // アクセストークン取得（SSR専用）
  static async getAccessToken(): Promise<string | null> {
    const session = await SessionManager.getSession();
    return session?.accessToken ?? null;
  }

  // リフレッシュトークン取得（SSR専用）
  static async getRefreshToken(): Promise<string | null> {
    const session = await SessionManager.getSession();
    return session?.refreshToken ?? null;
  }
}
