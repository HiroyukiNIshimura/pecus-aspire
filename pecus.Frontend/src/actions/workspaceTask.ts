'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { WorkspaceTaskDetailResponse, WorkspaceTaskDetailResponsePagedResponse } from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * ワークスペースアイテムのタスク一覧を取得
 */
export async function getWorkspaceTasks(
  workspaceId: number,
  itemId: number,
  page: number = 1,
  includeCompleted?: boolean,
  includeDiscarded?: boolean,
  assignedUserId?: number,
): Promise<ApiResponse<WorkspaceTaskDetailResponsePagedResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.getApiWorkspacesItemsTasks(
      workspaceId,
      itemId,
      page,
      includeCompleted,
      includeDiscarded,
      assignedUserId,
    );

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
 * タスクの詳細を取得
 */
export async function getWorkspaceTask(
  workspaceId: number,
  itemId: number,
  taskId: number,
): Promise<ApiResponse<WorkspaceTaskDetailResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.getApiWorkspacesItemsTasks1(workspaceId, itemId, taskId);

    return { success: true, data: response };
  } catch (error: unknown) {
    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'タスクの取得に失敗しました',
    };
  }
}
