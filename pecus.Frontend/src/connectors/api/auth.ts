import { SessionManager } from "@/libs/session";

// アクセストークン取得（サーバーサイドのみ）
export async function getAccessToken(): Promise<string> {
  console.log('getAccessToken: Getting session from SessionManager');
  const session = await SessionManager.getSession();
  console.log('getAccessToken: Session result:', !!session);
  if (!session?.accessToken) {
    console.log('getAccessToken: No access token in session');
    throw new Error("No access token");
  }
  console.log('getAccessToken: Returning access token, length:', session.accessToken.length);
  return session.accessToken;
}

// リフレッシュトークン取得（サーバーサイドのみ）
export async function getRefreshToken(): Promise<string> {
  console.log('getRefreshToken: Getting session from SessionManager');
  const session = await SessionManager.getSession();
  console.log('getRefreshToken: Session result:', !!session);
  if (!session?.refreshToken) {
    console.log('getRefreshToken: No refresh token in session');
    throw new Error("No refresh token");
  }
  console.log('getRefreshToken: Returning refresh token, length:', session.refreshToken.length);
  return session.refreshToken;
}

// リフレッシュトークンで再取得（サーバーサイドのみ）
export async function refreshAccessToken(): Promise<string> {
  console.log('refreshAccessToken: Starting token refresh');
  const refreshToken = await getRefreshToken();
  console.log('refreshAccessToken: Got refresh token, calling WebAPI refresh endpoint');

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/entrance/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    console.log('refreshAccessToken: Refresh API response status:', response.status);

    if (!response.ok) {
      console.log('refreshAccessToken: Refresh failed with status:', response.status);
      const errorText = await response.text();
      console.log('refreshAccessToken: Error response:', errorText);
      throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('refreshAccessToken: Got new tokens, updating session');

    // サーバーサイドではSessionManagerを更新
    const session = await SessionManager.getSession();
    if (session) {
      await SessionManager.setSession({
        ...session,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || session.refreshToken,
      });
      console.log('refreshAccessToken: Session updated successfully');
    } else {
      console.log('refreshAccessToken: No session found to update');
    }

    return data.accessToken;
  } catch (error) {
    console.log('refreshAccessToken: Refresh failed with error:', error);
    // 失敗したらWebAPIのログアウトエンドポイントを呼び出し
    try {
      console.log('refreshAccessToken: Calling logout endpoint');
      await fetch(`${process.env.API_BASE_URL}/api/entrance/logout`, { method: 'POST' });
    } catch (logoutError) {
      console.log('refreshAccessToken: Logout also failed');
    }
    throw new Error("Failed to refresh token");
  }
}
