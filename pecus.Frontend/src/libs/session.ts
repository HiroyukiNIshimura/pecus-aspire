import { cookies } from "next/headers";

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
  private static readonly ACCESS_TOKEN_KEY = "accessToken";
  private static readonly REFRESH_TOKEN_KEY = "refreshToken";
  private static readonly USER_KEY = "user";

  // セッション取得（SSR専用）
  static async getSession(): Promise<SessionData | null> {
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get(SessionManager.ACCESS_TOKEN_KEY)?.value;
      const refreshToken = cookieStore.get(SessionManager.REFRESH_TOKEN_KEY)?.value;
      const userStr = cookieStore.get(SessionManager.USER_KEY)?.value;

      if (!accessToken || !refreshToken || !userStr) {
        console.log("Server  Session incomplete:", {
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
        console.error("Server  Failed to parse user data:", parseError);
        return null;
      }
    } catch (error) {
      console.error("Server  Failed to get session:", error);
      return null;
    }
  }

  // セッション保存（Route Handler専用）
  // 注意: サーバーコンポーネントからは呼び出さないこと
  static async setSession(data: SessionData): Promise<void> {
    try {
      const cookieStore = await cookies();
      const userString = JSON.stringify(data.user);

      const cookieOptions = {
        path: "/",
        httpOnly: false,
        sameSite: "strict" as const,
        secure: process.env.NODE_ENV === "production", // 本番環境でのみHTTPS必須
        maxAge: 60 * 60 * 24 * 7, // 7日間保持
      };

      cookieStore.set(SessionManager.ACCESS_TOKEN_KEY, data.accessToken, cookieOptions);
      cookieStore.set(SessionManager.REFRESH_TOKEN_KEY, data.refreshToken, cookieOptions);
      cookieStore.set(SessionManager.USER_KEY, userString, cookieOptions);

      console.log("Server  Session saved successfully");
    } catch (error) {
      console.error("Server  Failed to set session:", error);
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
      console.log("Server  Session cleared");
    } catch (error) {
      console.error("Server  Failed to clear session:", error);
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
