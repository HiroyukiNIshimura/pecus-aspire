'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  DashboardTaskFilter,
  MyCommitterWorkspaceResponse,
  PagedResponseOfItemWithTasksResponse,
  TasksByDueDateResponse,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
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
    return handleApiErrorForAction<MyCommitterWorkspaceResponse[]>(error, {
      defaultMessage: 'コミッターワークスペース一覧の取得に失敗しました',
    });
  }
}

/**
 * 指定ワークスペースのコミッターアイテム一覧を取得
 */
export async function fetchMyCommitterItems(
  workspaceId: number,
  page: number = 1,
): Promise<ApiResponse<PagedResponseOfItemWithTasksResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.my.getApiMyCommitterItems(page, workspaceId);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch committer items:', error);
    return handleApiErrorForAction<PagedResponseOfItemWithTasksResponse>(error, {
      defaultMessage: 'コミッターアイテム一覧の取得に失敗しました',
    });
  }
}

/**
 * 指定ワークスペース内のコミッタータスクを期限日グループで取得
 */
export async function fetchCommitterTasksByWorkspace(
  workspaceId: number,
  filter?: DashboardTaskFilter,
): Promise<ApiResponse<TasksByDueDateResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.my.getApiMyCommitterWorkspacesTasks(workspaceId, filter);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch committer tasks by workspace:', error);
    return handleApiErrorForAction<TasksByDueDateResponse[]>(error, {
      defaultMessage: 'コミッタータスク一覧の取得に失敗しました',
    });
  }
}
