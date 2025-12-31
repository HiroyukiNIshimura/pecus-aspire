'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  CreateTaskCommentRequest,
  PagedResponseOfTaskCommentDetailResponse,
  TaskCommentDetailResponse,
  TaskCommentResponse,
  TaskCommentType,
  UpdateTaskCommentRequest,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * タスクコメント一覧を取得
 */
export async function getTaskComments(
  workspaceId: number,
  itemId: number,
  taskId: number,
  page: number = 1,
  commentType?: TaskCommentType,
  includeDeleted?: boolean,
): Promise<ApiResponse<PagedResponseOfTaskCommentDetailResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.taskComment.getApiWorkspacesItemsTasksComments(
      workspaceId,
      itemId,
      taskId,
      page,
      commentType,
      includeDeleted,
    );

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('getTaskComments error:', error);
    return handleApiErrorForAction<PagedResponseOfTaskCommentDetailResponse>(error, {
      defaultMessage: 'コメント一覧の取得に失敗しました',
    });
  }
}

/**
 * タスクコメントの詳細を取得
 */
export async function getTaskComment(
  workspaceId: number,
  itemId: number,
  taskId: number,
  commentId: number,
): Promise<ApiResponse<TaskCommentDetailResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.taskComment.getApiWorkspacesItemsTasksComments1(workspaceId, itemId, taskId, commentId);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('getTaskComment error:', error);
    return handleApiErrorForAction<TaskCommentDetailResponse>(error, {
      defaultMessage: 'コメントの取得に失敗しました',
    });
  }
}

/**
 * タスクコメントを作成
 */
export async function createTaskComment(
  workspaceId: number,
  itemId: number,
  taskId: number,
  request: CreateTaskCommentRequest,
): Promise<ApiResponse<TaskCommentResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.taskComment.postApiWorkspacesItemsTasksComments(workspaceId, itemId, taskId, request);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('createTaskComment error:', error);
    return handleApiErrorForAction<TaskCommentResponse>(error, {
      defaultMessage: 'コメントの作成に失敗しました',
    });
  }
}

/**
 * タスクコメントを更新（作成者のみ）
 */
export async function updateTaskComment(
  workspaceId: number,
  itemId: number,
  taskId: number,
  commentId: number,
  request: UpdateTaskCommentRequest,
): Promise<ApiResponse<TaskCommentResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.taskComment.putApiWorkspacesItemsTasksComments(
      workspaceId,
      itemId,
      taskId,
      commentId,
      request,
    );

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
              type: 'taskComment',
              data: concurrencyError.payload.current as TaskCommentDetailResponse,
            }
          : undefined,
      };
    }

    console.error('updateTaskComment error:', error);
    return handleApiErrorForAction<TaskCommentResponse>(error, {
      defaultMessage: 'コメントの更新に失敗しました',
    });
  }
}

/**
 * タスクコメントを削除（作成者のみ）
 */
export async function deleteTaskComment(
  workspaceId: number,
  itemId: number,
  taskId: number,
  commentId: number,
  rowVersion: number,
): Promise<ApiResponse<TaskCommentResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.taskComment.deleteApiWorkspacesItemsTasksComments(
      workspaceId,
      itemId,
      taskId,
      commentId,
      { rowVersion },
    );

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
              type: 'taskComment',
              data: concurrencyError.payload.current as TaskCommentDetailResponse,
            }
          : undefined,
      };
    }

    console.error('deleteTaskComment error:', error);
    return handleApiErrorForAction<TaskCommentResponse>(error, {
      defaultMessage: 'コメントの削除に失敗しました',
    });
  }
}
