'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { ApiResponse } from './types';

/**
 * Server Action: 現在のユーザー情報を取得
 *
 * Note: Middlewareがトークンの有効性を事前に検証するため、
 * ここではenableRefreshの指定は不要（デフォルト値を使用）
 */
export async function getCurrentUser(): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.getApiProfile();
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to fetch current user:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'Failed to fetch current user'
    };
  }
}

/**
 * Server Action: プロフィールを更新
 */
export async function updateProfile(request: {
  username?: string;
  email?: string;
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.profile.putApiProfile(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'Failed to update profile'
    };
  }
}
