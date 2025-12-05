'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse,
  TaskStatusFilter,
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
