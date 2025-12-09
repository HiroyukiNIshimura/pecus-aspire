'use server';

import { ServerSessionManager } from '@/libs/serverSession';

/**
 * アクセストークン取得（SSR専用）
 *
 * Redis からセッションを取得し、アクセストークンを返す。
 * 必要に応じて自動リフレッシュを行う。
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    // 有効なアクセストークンを取得（期限切れ間近なら自動リフレッシュ）
    return await ServerSessionManager.getValidAccessToken();
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * リフレッシュトークン取得（SSR専用）
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await ServerSessionManager.getRefreshToken();
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

/**
 * トークンリフレッシュ処理（Server Action）
 *
 * ServerSessionManager.refreshTokens() を使用して
 * Redis 上のセッションを更新する。
 *
 * @returns 新しいアクセストークンと永続化フラグ
 */
export async function refreshAccessToken(): Promise<{
  accessToken: string;
  persisted: boolean;
}> {
  console.log('[auth] Refreshing access token');

  try {
    const updatedSession = await ServerSessionManager.refreshTokens();

    if (!updatedSession) {
      throw new Error('Failed to refresh token - session destroyed');
    }

    console.log('[auth] Token refreshed successfully');
    return { accessToken: updatedSession.accessToken, persisted: true };
  } catch (error) {
    console.error('[auth] Failed to refresh access token:', error);
    throw error;
  }
}
