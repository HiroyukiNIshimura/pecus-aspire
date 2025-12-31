'use server';

import { getPublicApiBaseUrl } from '@/libs/env';
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
 * SignalRはクライアント（ブラウザ）から直接WebAPIに接続するため、
 * 公開URL（NEXT_PUBLIC_API_URL）を使用する必要がある。
 * 内部URL（PECUS_API_URL）を使うとブラウザからアクセスできない。
 *
 * 本番環境ルーティング:
 *   /backend/* → .NET WebAPI
 *   /api/*     → Next.js API Routes
 *
 * @returns Hub の完全な公開URL
 */
export async function getSignalRHubUrl(): Promise<string> {
  const baseUrl = getPublicApiBaseUrl();
  // NEXT_PUBLIC_API_URL は /backend を含む（例: https://domain.com/backend）
  // Hub URL は /backend/hubs/notifications となる
  return `${baseUrl}/hubs/notifications`;
}
