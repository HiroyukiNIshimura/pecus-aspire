'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { ApiResponse } from './types';
import { SessionData, SessionManager } from '@/libs/session';

/**
 * Server Action: ログイン
 */
export async function login(request: {
  loginIdentifier: string;
  password: string;
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients(false); // リフレッシュ無効（ログイン前）
    const response = await api.entranceAuth.apiEntranceAuthLoginPost({
      loginRequest: {
        loginIdentifier: request.loginIdentifier,
        password: request.password,
      }
    });

    // APIレスポンスからトークンを取得
    const accessToken = response.data.accessToken;
    const refreshToken = response.data.refreshToken || '';

    if (!accessToken) {
      return {
        success: false,
        error: 'Invalid response from server'
      };
    }

    // セッション情報を保存
    const sessionData: SessionData = {
      accessToken,
      refreshToken,
      user: {
        id: response.data.userId || 0,
        name: response.data.username || '',
        email: response.data.email || '',
        roles: response.data.roles ? response.data.roles.map(role => role.name || '') : [],
      },
    };

    await SessionManager.setSession(sessionData);

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Failed to login:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to login'
    };
  }
}

/**
 * Server Action: ログアウト
 */
export async function logout(): Promise<ApiResponse<any>> {
  try {
    // セッション情報をクリア（WebAPI呼び出しなし）
    await SessionManager.clearSession();

    return { success: true, data: null };
  } catch (error: any) {
    console.error('Failed to logout:', error);
    return {
      success: false,
      error: error.message || 'Failed to logout'
    };
  }
}
