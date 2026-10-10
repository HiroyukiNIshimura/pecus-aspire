'use server';

import { getMasterGenresWithHeyApi } from '@/connectors/HeyApiClient';
import type { MasterGenreResponse } from '@/connectors/hey-api-axios/types.gen';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * Server Action: マスタージャンル一覧を取得
 */
export async function getGenres(): Promise<ApiResponse<MasterGenreResponse[]>> {
  try {
    const response = await getMasterGenresWithHeyApi();
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    return handleApiErrorForAction<MasterGenreResponse[]>(error, {
      defaultMessage: 'マスタージャンルの取得に失敗しました。',
    });
  }
}
