'use server';

import { headers } from 'next/headers';
import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { LoginResponse, RoleInfoResponse } from '@/connectors/api/pecus';
import type { DeviceType } from '@/connectors/api/pecus/models/DeviceType';
import type { OSPlatform } from '@/connectors/api/pecus/models/OSPlatform';
import { type CreateSessionInput, type ServerSessionData, ServerSessionManager } from '@/libs/serverSession';
import type { ApiResponse } from './types';
import { serverError } from './types';

/**
 * Server Action: ログイン
 *
 * 認証成功時、Redis にセッションを作成し、Cookie には sessionId のみ保存。
 * トークンはブラウザに送信されない（Redis 内に保持）。
 */
export async function login(request: {
  loginIdentifier: string;
  password: string;
  deviceName?: string;
  deviceType: DeviceType;
  os: OSPlatform;
  userAgent?: string;
  appVersion?: string;
  timezone?: string;
  location?: string;
}): Promise<ApiResponse<LoginResponse>> {
  try {
    // Next.js のヘッダーからクライアントIPを取得
    const headersList = await headers();
    const clientIp =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') || // Cloudflare 対応
      undefined;

    const api = createPecusApiClients();
    const response = await api.entranceAuth.postApiEntranceAuthLogin({
      loginIdentifier: request.loginIdentifier,
      password: request.password,
      deviceName: request.deviceName,
      deviceType: request.deviceType,
      os: request.os,
      userAgent: request.userAgent,
      appVersion: request.appVersion,
      timezone: request.timezone,
      location: request.location,
      ipAddress: clientIp,
    });

    // APIレスポンスからトークンを取得
    const accessToken = response.accessToken;
    const refreshToken = response.refreshToken || '';

    if (!accessToken) {
      return serverError('Invalid response from server');
    }

    // Redis にセッションを作成（Cookie には sessionId のみ保存）
    const sessionInput: CreateSessionInput = {
      accessToken,
      refreshToken,
      accessExpiresAt: response.expiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      refreshExpiresAt: response.refreshExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: response.userId || 0,
        name: response.username || '',
        email: response.email || '',
        roles: response.roles ? response.roles.map((role: RoleInfoResponse) => role.name || '') : [],
      },
      device: {
        publicId: response.device?.publicId ?? undefined,
        name: request.deviceName,
        type: request.deviceType,
        os: request.os,
        userAgent: request.userAgent,
        appVersion: request.appVersion,
        timezone: request.timezone,
        location: request.location,
        ipAddress: clientIp,
      },
    };

    await ServerSessionManager.createSession(sessionInput);

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to login:', error);
    return parseErrorResponse(error, 'ログインに失敗しました');
  }
}

/**
 * Server Action: 現在のユーザー情報を取得
 *
 * 用途: SSR ページでの認証チェック
 * - ログイン済みならユーザー情報を返す
 * - 未認証なら null を返す
 */
export async function getCurrentUser(): Promise<ApiResponse<ServerSessionData['user'] | null>> {
  try {
    const user = await ServerSessionManager.getUser();

    if (!user) {
      return { success: true, data: null };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return parseErrorResponse(error, 'ユーザー情報の取得に失敗しました');
  }
}

/**
 * Server Action: ログアウト
 *
 * 1. WebAPI のログアウトエンドポイントを呼び出してトークンを無効化
 * 2. Redis からセッションを削除
 * 3. Cookie から sessionId を削除
 */
export async function logout(): Promise<ApiResponse<null>> {
  try {
    const session = await ServerSessionManager.getSession();

    // WebAPIのログアウトエンドポイントを呼んでトークンを無効化
    if (session?.accessToken) {
      const apiBaseUrl = process.env.API_BASE_URL || 'https://localhost:7265';
      try {
        await fetch(`${apiBaseUrl}/api/entrance/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: session.refreshToken || '' }),
        });
      } catch (error) {
        console.error('Failed to call logout API:', error);
        // エラーは無視してセッションクリアを続行
      }
    }

    // Redis セッションと Cookie を削除
    await ServerSessionManager.destroySession();

    return { success: true, data: null };
  } catch (error) {
    console.error('Failed to logout:', error);
    return parseErrorResponse(error, 'ログアウトに失敗しました');
  }
}
