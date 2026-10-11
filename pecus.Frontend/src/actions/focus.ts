'use server';

import { getFocusRecommendationWithHeyApi } from '@/connectors/HeyApiClient';
import type { FocusRecommendationResponse } from '@/connectors/hey-api-axios/types.gen';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * ログインユーザーのやることピックアップタスクを取得
 */
export async function fetchFocusRecommendation(): Promise<ApiResponse<FocusRecommendationResponse>> {
  try {
    const response = await getFocusRecommendationWithHeyApi();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch focus recommendation:', error);
    return handleApiErrorForAction<FocusRecommendationResponse>(error, {
      defaultMessage: 'やることピックアップタスクの取得に失敗しました',
    });
  }
}
