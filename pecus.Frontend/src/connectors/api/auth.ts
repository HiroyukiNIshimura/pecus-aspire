import { SessionManager } from "@/libs/session";

// クライアントサイドかどうかを判定
const isClient = typeof window !== 'undefined';

// アクセストークン取得
export async function getAccessToken(): Promise<string> {
  if (isClient) {
    // クライアントサイドではlocalStorageから取得
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error("No access token");
    return token;
  } else {
    // サーバーサイドではSessionManagerを使用
    const session = await SessionManager.getSession();
    if (!session?.accessToken) throw new Error("No access token");
    return session.accessToken;
  }
}

// リフレッシュトークン取得
export async function getRefreshToken(): Promise<string> {
  if (isClient) {
    // クライアントサイドではlocalStorageから取得
    const token = localStorage.getItem('refreshToken');
    if (!token) throw new Error("No refresh token");
    return token;
  } else {
    // サーバーサイドではSessionManagerを使用
    const session = await SessionManager.getSession();
    if (!session?.refreshToken) throw new Error("No refresh token");
    return session.refreshToken;
  }
}

// リフレッシュトークンで再取得
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    if (isClient) {
      // クライアントサイドではlocalStorageを更新
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
    } else {
      // サーバーサイドではSessionManagerを更新
      const session = await SessionManager.getSession();
      if (session) {
        await SessionManager.setSession({
          ...session,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || session.refreshToken,
        });
      }
    }

    return data.accessToken;
  } catch (error) {
    // 失敗したらログアウト
    await fetch('/api/auth/logout', { method: 'POST' });
    throw new Error("Failed to refresh token");
  }
}
