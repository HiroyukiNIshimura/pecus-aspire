'use server';

import { headers } from 'next/headers';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { LoginResponse } from '@/connectors/api/pecus';
import type { DeviceType } from '@/connectors/api/pecus/models/DeviceType';
import type { OSPlatform } from '@/connectors/api/pecus/models/OSPlatform';
import { type SessionData, SessionManager } from '@/libs/session';
import type { ApiResponse } from './types';

/**
 * Server Action: ログイン
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

    const api = createPecusApiClients(); // OpenAPI設定を使用（引数不要）
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
      return {
        success: false,
        error: 'server',
        message: 'Invalid response from server',
      };
    }

    // セッション情報を保存
    const sessionData: SessionData = {
      accessToken,
      refreshToken,
      user: {
        id: response.userId || 0,
        name: response.username || '',
        email: response.email || '',
        roles: response.roles ? response.roles.map((role: any) => role.name || '') : [],
      },
    };

    await SessionManager.setSession(sessionData);

    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to login:', error);
    return {
      success: false,
      error: 'server',
      message: error.body?.message || error.message || 'Failed to login',
    };
  }
}

/**
 * Server Action: 現在のユーザー情報を取得
 *
 * 用途: SSR ページでの認証チェック
 * - ログイン済みならユーザー情報を返す
 * - 未認証なら null を返す
 */
export async function getCurrentUser(): Promise<ApiResponse<SessionData['user'] | null>> {
  try {
    const session = await SessionManager.getSession();

    if (!session || !session.user) {
      return { success: true, data: null };
    }

    return { success: true, data: session.user };
  } catch (error: any) {
    console.error('Failed to get current user:', error);
    return {
      success: false,
      error: 'server',
      message: error.message || 'Failed to get current user',
    };
  }
}

/**
 * Server Action: ログアウト
 */
export async function logout(): Promise<ApiResponse<null>> {
  try {
    // セッション情報をクリア（WebAPI呼び出しなし）
    await SessionManager.clearSession();

    return { success: true, data: null };
  } catch (error: any) {
    console.error('Failed to logout:', error);
    return {
      success: false,
      error: 'server',
      message: error.message || 'Failed to logout',
    };
  }
}
