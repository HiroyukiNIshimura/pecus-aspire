import { SessionManager } from "@/libs/session";
import { createPecusApiClients } from "./PecusApiClient";

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

// リフレッシュトークンで再取得（API Route経由）
export async function refreshAccessToken(): Promise<string> {
  console.log('refreshAccessToken: Calling API Route for token refresh');

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Refresh failed with status ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error('Refresh API returned error');
    }

    console.log('refreshAccessToken: Refresh successful via API Route');

    // 新しいアクセストークンを取得して返す
    const session = await SessionManager.getSession();
    if (!session?.accessToken) {
      throw new Error('No access token after refresh');
    }

    return session.accessToken;
  } catch (error: any) {
    console.error('refreshAccessToken: Refresh failed with error:', error);
    throw error;
  }
}
