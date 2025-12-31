'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  DashboardTaskFilter,
  MyTaskWorkspaceResponse,
  PagedResponseOfMyTaskDetailResponseAndWorkspaceTaskStatistics,
  TaskStatusFilter,
  TasksByDueDateResponse,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * ログインユーザーに割り当てられたタスク一覧を取得
 */
export async function fetchMyTasks(
  page: number = 1,
  status?: TaskStatusFilter,
): Promise<ApiResponse<PagedResponseOfMyTaskDetailResponseAndWorkspaceTaskStatistics>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.my.getApiMyTasks(page, status);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to fetch my tasks:', error);
    return handleApiErrorForAction<PagedResponseOfMyTaskDetailResponseAndWorkspaceTaskStatistics>(error, {
      defaultMessage: 'タスク一覧の取得に失敗しました',
    });
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
    return handleApiErrorForAction<MyTaskWorkspaceResponse[]>(error, {
      defaultMessage: 'タスクワークスペース一覧の取得に失敗しました',
    });
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
    return handleApiErrorForAction<TasksByDueDateResponse[]>(error, {
      defaultMessage: 'マイタスク一覧の取得に失敗しました',
    });
  }
}
