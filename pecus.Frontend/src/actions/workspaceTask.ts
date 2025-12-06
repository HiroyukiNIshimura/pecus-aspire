'use server';

import { createPecusApiClients, detectConcurrencyError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  AssigneeTaskLoadResponse,
  CreateWorkspaceTaskRequest,
  TaskStatusFilter,
  UpdateWorkspaceTaskRequest,
  WorkspaceTaskDetailResponse,
  WorkspaceTaskDetailResponseWorkspaceTaskStatisticsPagedResponse,
  WorkspaceTaskResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from './types';
import { validationError } from './types';

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
): Promise<ApiResponse<WorkspaceTaskDetailResponseWorkspaceTaskStatisticsPagedResponse>> {
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

/**
 * ワークスペースタスクを作成
 */
export async function createWorkspaceTask(
  workspaceId: number,
  itemId: number,
  request: CreateWorkspaceTaskRequest,
): Promise<ApiResponse<WorkspaceTaskResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.postApiWorkspacesItemsTasks(workspaceId, itemId, request);

    return { success: true, data: response };
  } catch (error: unknown) {
    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'タスクの作成に失敗しました',
    };
  }
}

/**
 * ワークスペースタスクを更新
 */
export async function updateWorkspaceTask(
  workspaceId: number,
  itemId: number,
  taskId: number,
  request: UpdateWorkspaceTaskRequest,
): Promise<ApiResponse<WorkspaceTaskResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.putApiWorkspacesItemsTasks(workspaceId, itemId, taskId, request);

    return { success: true, data: response };
  } catch (error: unknown) {
    // 競合エラーのチェック
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: concurrencyError.payload.current
          ? {
              type: 'workspaceTask',
              data: concurrencyError.payload.current as WorkspaceTaskDetailResponse,
            }
          : undefined,
      };
    }

    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'タスクの更新に失敗しました',
    };
  }
}

/**
 * 担当者の期限日別タスク負荷をチェック
 */
export async function checkAssigneeTaskLoad(
  workspaceId: number,
  itemId: number,
  assignedUserId?: number,
  dueDate?: string,
): Promise<ApiResponse<AssigneeTaskLoadResponse>> {
  if (!assignedUserId) {
    return validationError('担当者を選択してください。');
  }
  if (!dueDate) {
    return validationError('期限日を選択してください。');
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.getApiWorkspacesItemsTasksAssigneeLoadCheck(
      workspaceId,
      itemId,
      assignedUserId,
      dueDate,
    );

    return { success: true, data: response };
  } catch (error) {
    return parseErrorResponse(error, '担当者のタスク負荷の確認に失敗しました');
  }
}
