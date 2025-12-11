'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { ActivityResponsePagedResponse } from '@/connectors/api/pecus';
import type { ActionResult } from './types';

/**
 * アイテムのアクティビティ一覧を取得（タイムライン表示用）
 */
export async function fetchItemActivities(
  workspaceId: number,
  itemId: number,
  page: number = 1,
): Promise<ActionResult<ActivityResponsePagedResponse>> {
  try {
    const api = await createPecusApiClients();
    const result = await api.activity.getApiWorkspacesItemsActivities(workspaceId, itemId, page);
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorResponse = parseErrorResponse(error);
    return { success: false, message: errorResponse.message || 'アクティビティの取得に失敗しました。' };
  }
}
