'use server';

import { getApiBaseUrl } from '@/libs/env';
import { ServerSessionManager } from '@/libs/serverSession';

/**
 * SignalR 接続用のアクセストークンを取得する Server Action
 *
 * SignalR クライアントの accessTokenFactory から呼び出される。
 * トークンが期限切れ間近の場合は自動的にリフレッシュされる。
 *
 * @returns アクセストークン、またはセッション無効時は null
 */
export async function getSignalRToken(): Promise<string | null> {
  try {
    // 有効なアクセストークンを取得（期限切れ間近なら自動リフレッシュ）
    const token = await ServerSessionManager.getValidAccessToken();

    if (!token) {
      console.warn('[SignalR] No valid access token available');
      return null;
    }

    return token;
  } catch (error) {
    console.error('[SignalR] Failed to get access token:', error);
    return null;
  }
}

/**
 * SignalR Hub の URL を取得する Server Action
 *
 * 統一ヘルパー getApiBaseUrl() を使用して WebAPI のベース URL を取得し、
 * Hub パスを付与して返す。
 *
 * @returns Hub の完全な URL
 */
export async function getSignalRHubUrl(): Promise<string> {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/hubs/notifications`;
}
