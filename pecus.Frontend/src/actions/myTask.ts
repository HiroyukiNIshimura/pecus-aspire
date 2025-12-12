'use server';

import { createPecusApiClients, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  DashboardTaskFilter,
  MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse,
  MyTaskWorkspaceResponse,
  TaskStatusFilter,
  TasksByDueDateResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * ログインユーザーに割り当てられたタスク一覧を取得
 */
export async function fetchMyTasks(
  page: number = 1,
  status?: TaskStatusFilter,
): Promise<ApiResponse<MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.my.getApiMyTasks(page, status);

    return { success: true, data: response };
  } catch (error: unknown) {
    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'タスク一覧の取得に失敗しました',
    };
  }
}

/**
 * ログインユーザーが担当のタスクを持つワークスペース一覧を取得
 */
export async function fetchMyTaskWorkspaces(): Promise<ApiResponse<MyTaskWorkspaceResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.my.getApiMyTaskWorkspaces();

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch task workspaces:', error);
    return parseErrorResponse(error, 'タスクワークスペース一覧の取得に失敗しました');
  }
}

/**
 * 指定ワークスペース内のマイタスクを期限日グループで取得
 */
export async function fetchMyTasksByWorkspace(
  workspaceId: number,
  filter?: DashboardTaskFilter,
): Promise<ApiResponse<TasksByDueDateResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.my.getApiMyTaskWorkspacesTasks(workspaceId, filter);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch my tasks by workspace:', error);
    return parseErrorResponse(error, 'マイタスク一覧の取得に失敗しました');
  }
}
