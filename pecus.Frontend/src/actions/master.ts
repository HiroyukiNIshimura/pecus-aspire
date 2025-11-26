'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse } from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * Server Action: マスタージャンル一覧を取得
 */
export async function getGenres(): Promise<ApiResponse<MasterGenreResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.master.getApiMasterGenres();
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    return parseErrorResponse(error, 'マスタージャンルの取得に失敗しました。');
  }
}
