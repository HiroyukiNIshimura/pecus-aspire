import { cookies } from 'next/headers';

export type SessionData = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
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
      const accessToken = cookieStore.get(this.ACCESS_TOKEN_KEY)?.value;
      const refreshToken = cookieStore.get(this.REFRESH_TOKEN_KEY)?.value;
      const userStr = cookieStore.get(this.USER_KEY)?.value;

      if (!accessToken || !refreshToken || !userStr) {
        console.log('Server  Session incomplete:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUser: !!userStr
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

      cookieStore.set(this.ACCESS_TOKEN_KEY, data.accessToken, {
        path: '/',
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      cookieStore.set(this.REFRESH_TOKEN_KEY, data.refreshToken, {
        path: '/',
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      cookieStore.set(this.USER_KEY, userString, {
        path: '/',
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
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
      cookieStore.delete(this.ACCESS_TOKEN_KEY);
      cookieStore.delete(this.REFRESH_TOKEN_KEY);
      cookieStore.delete(this.USER_KEY);
      console.log('Server  Session cleared');
    } catch (error) {
      console.error('Server  Failed to clear session:', error);
      throw error;
    }
  }

  // アクセストークン取得（SSR専用）
  static async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.accessToken ?? null;
  }

  // リフレッシュトークン取得（SSR専用）
  static async getRefreshToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.refreshToken ?? null;
  }
}