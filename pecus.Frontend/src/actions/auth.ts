'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { LoginResponse, RoleInfoResponse } from '@/connectors/api/pecus';
import { getApiBaseUrl } from '@/libs/env';
import { type CreateSessionInput, type ServerSessionData, ServerSessionManager } from '@/libs/serverSession';
import { type LoginActionInput, loginActionInputSchema } from '@/schemas/signInSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { serverError, validationError } from './types';

/**
 * Server Action: ログイン
 *
 * 認証成功時、Redis にセッションを作成し、Cookie には sessionId のみ保存。
 * トークンはブラウザに送信されない（Redis 内に保持）。
 */
export async function login(input: LoginActionInput): Promise<ApiResponse<LoginResponse>> {
  const parseResult = loginActionInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

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
      loginIdentifier: parseResult.data.loginIdentifier,
      password: parseResult.data.password,
      deviceName: parseResult.data.deviceName,
      deviceType: parseResult.data.deviceType,
      os: parseResult.data.os,
      userAgent: parseResult.data.userAgent,
      appVersion: parseResult.data.appVersion,
      timezone: parseResult.data.timezone,
      location: parseResult.data.location,
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
        name: parseResult.data.deviceName,
        type: parseResult.data.deviceType ?? undefined,
        os: parseResult.data.os ?? undefined,
        userAgent: parseResult.data.userAgent,
        appVersion: parseResult.data.appVersion,
        timezone: parseResult.data.timezone,
        location: parseResult.data.location,
        ipAddress: clientIp,
      },
    };

    await ServerSessionManager.createSession(sessionInput);

    return { success: true, data: response };
  } catch (error) {
    return handleApiErrorForAction<LoginResponse>(error, {
      defaultMessage: 'ログインに失敗しました',
    });
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
    return handleApiErrorForAction<ServerSessionData['user'] | null>(error, {
      defaultMessage: 'ユーザー情報の取得に失敗しました',
    });
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
      const apiBaseUrl = getApiBaseUrl();
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
  } catch (error) {
    console.error('Failed to logout:', error);
    return handleApiErrorForAction<null>(error, {
      defaultMessage: 'ログアウトに失敗しました',
    });
  }
  // redirect() は try/catch の外で呼ぶ（Next.js の NEXT_REDIRECT を catch させないため）
  // Server Action からの redirect はページ再レンダリングをスキップするため、
  // セッション破棄後に RSC が 401 エラーを出す問題を防ぐ
  redirect('/signin');
}
