'use server';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { UserAchievementResponse } from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * Server Action: 指定ユーザーの取得済み実績を取得
 * 公開範囲設定に基づきフィルタリングされる
 */
export async function getUserAchievements(userId: number): Promise<ApiResponse<UserAchievementResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.user.getApiUsersAchievements(userId);
    return { success: true, data: response };
  } catch (error) {
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザー実績の取得に失敗しました' });
  }
}
