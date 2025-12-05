'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { ItemWithTasksResponsePagedResponse, MyCommitterWorkspaceResponse } from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * ログインユーザーがコミッターになっているワークスペース一覧を取得
 */
export async function fetchMyCommitterWorkspaces(): Promise<ApiResponse<MyCommitterWorkspaceResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.my.getApiMyCommitterWorkspaces();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch committer workspaces:', error);
    return parseErrorResponse(error, 'コミッターワークスペース一覧の取得に失敗しました');
  }
}

/**
 * 指定ワークスペースのコミッターアイテム一覧を取得
 */
export async function fetchMyCommitterItems(
  workspaceId: number,
  page: number = 1,
): Promise<ApiResponse<ItemWithTasksResponsePagedResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.my.getApiMyCommitterItems(page, workspaceId);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch committer items:', error);
    return parseErrorResponse(error, 'コミッターアイテム一覧の取得に失敗しました');
  }
}
