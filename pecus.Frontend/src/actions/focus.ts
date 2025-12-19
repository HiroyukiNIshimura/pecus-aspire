'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { FocusRecommendationResponse } from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * ログインユーザーのやることピックアップタスクを取得
 */
export async function fetchFocusRecommendation(): Promise<ApiResponse<FocusRecommendationResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.focus.getApiFocusMe();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch focus recommendation:', error);
    return parseErrorResponse(error, 'やることピックアップタスクの取得に失敗しました');
  }
}
