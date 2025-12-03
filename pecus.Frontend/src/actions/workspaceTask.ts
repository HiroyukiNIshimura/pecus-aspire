'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  TaskStatusFilter,
  WorkspaceTaskDetailResponse,
  WorkspaceTaskDetailResponsePagedResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * ワークスペースアイテムのタスク一覧を取得
 */
export async function getWorkspaceTasks(
  workspaceId: number,
  itemId: number,
  page: number = 1,
  pageSize: number = 10,
  status?: TaskStatusFilter,
  assignedUserId?: number,
): Promise<ApiResponse<WorkspaceTaskDetailResponsePagedResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.getApiWorkspacesItemsTasks(
      workspaceId,
      itemId,
      page,
      pageSize,
      status,
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
 * ワークスペースアイテムのタスク一覧を全件取得（クライアントサイドページング用）
 * @deprecated サーバーサイドページングを使用してください
 */
export async function getAllWorkspaceTasks(
  workspaceId: number,
  itemId: number,
  status?: TaskStatusFilter,
  assignedUserId?: number,
): Promise<ApiResponse<WorkspaceTaskDetailResponse[]>> {
  try {
    const api = await createPecusApiClients();
    const allTasks: WorkspaceTaskDetailResponse[] = [];
    let page = 1;
    let hasMore = true;
    const pageSize = 100; // 最大件数で取得

    // 全ページを取得
    while (hasMore) {
      const response = await api.workspaceTask.getApiWorkspacesItemsTasks(
        workspaceId,
        itemId,
        page,
        pageSize,
        status,
        assignedUserId,
      );

      if (response.data && response.data.length > 0) {
        allTasks.push(...response.data);
        page++;
        hasMore = page <= (response.totalPages || 1);
      } else {
        hasMore = false;
      }
    }

    return { success: true, data: allTasks };
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
