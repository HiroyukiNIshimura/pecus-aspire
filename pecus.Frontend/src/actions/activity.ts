'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { ActivityPeriod, ActivityResponsePagedResponse } from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * アイテムのアクティビティ一覧を取得（タイムライン表示用）
 */
export async function fetchItemActivities(
  workspaceId: number,
  itemId: number,
  page: number = 1,
): Promise<ApiResponse<ActivityResponsePagedResponse>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.activity.getApiWorkspacesItemsActivities(workspaceId, itemId, page);
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorResponse = parseErrorResponse(error);
    return {
      success: false,
      error: 'server',
      message: errorResponse.message || 'アクティビティの取得に失敗しました。',
    };
  }
}

/**
 * マイアクティビティ一覧を取得（ユーザー活動レポート用）
 */
export async function fetchMyActivities(
  page: number = 1,
  period?: ActivityPeriod,
): Promise<ApiResponse<ActivityResponsePagedResponse>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.my.getApiMyActivities(page, period);
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorResponse = parseErrorResponse(error);
    return {
      success: false,
      error: 'server',
      message: errorResponse.message || 'アクティビティの取得に失敗しました。',
    };
  }
}
