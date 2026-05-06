'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  PagedResponseOfTaskCommentDetailResponse,
  TaskCommentDetailResponse,
  TaskCommentResponse,
  TaskCommentType,
} from '@/connectors/api/pecus';
import {
  type CreateTaskCommentInput,
  createTaskCommentInputSchema,
  type DeleteTaskCommentInput,
  deleteTaskCommentInputSchema,
  type UpdateTaskCommentInput,
  updateTaskCommentInputSchema,
} from '@/schemas/workspaceTaskCommentSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

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
export async function createTaskComment(input: CreateTaskCommentInput): Promise<ApiResponse<TaskCommentResponse>> {
  const parseResult = createTaskCommentInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.taskComment.postApiWorkspacesItemsTasksComments(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.taskId,
      parseResult.data.request,
    );

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
export async function updateTaskComment(input: UpdateTaskCommentInput): Promise<ApiResponse<TaskCommentResponse>> {
  const parseResult = updateTaskCommentInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.taskComment.putApiWorkspacesItemsTasksComments(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.taskId,
      parseResult.data.commentId,
      parseResult.data.request,
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
export async function deleteTaskComment(input: DeleteTaskCommentInput): Promise<ApiResponse<TaskCommentResponse>> {
  const parseResult = deleteTaskCommentInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.taskComment.deleteApiWorkspacesItemsTasksComments(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.taskId,
      parseResult.data.commentId,
      { rowVersion: parseResult.data.rowVersion },
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
