'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  CreateTaskCommentRequest,
  TaskCommentDetailResponse,
  TaskCommentDetailResponsePagedResponse,
  TaskCommentResponse,
  TaskCommentType,
  UpdateTaskCommentRequest,
} from '@/connectors/api/pecus';
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
): Promise<ApiResponse<TaskCommentDetailResponsePagedResponse>> {
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
    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'コメント一覧の取得に失敗しました',
    };
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
    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'コメントの取得に失敗しました',
    };
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
    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'コメントの作成に失敗しました',
    };
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

    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'コメントの更新に失敗しました',
    };
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

    const err = error as { body?: { message?: string }; message?: string };
    return {
      success: false,
      error: 'server',
      message: err.body?.message || err.message || 'コメントの削除に失敗しました',
    };
  }
}
