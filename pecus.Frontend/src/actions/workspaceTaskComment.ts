'use server';

import {
  createTaskCommentWithHeyApi,
  deleteTaskCommentWithHeyApi,
  getTaskCommentsWithHeyApi,
  getTaskCommentWithHeyApi,
  updateTaskCommentWithHeyApi,
} from '@/connectors/HeyApiClient';
import type {
  PagedResponseOfTaskCommentDetailResponse,
  TaskCommentDetailResponse,
  TaskCommentResponse,
} from '@/connectors/hey-api-axios/types.gen';
import { detectConcurrencyError } from '@/connectors/legacy-api/PecusApiClient';
import {
  type CreateTaskCommentInput,
  createTaskCommentInputSchema,
  type DeleteTaskCommentInput,
  deleteTaskCommentInputSchema,
  type GetTaskCommentInput,
  type GetTaskCommentsInput,
  getTaskCommentInputSchema,
  getTaskCommentsInputSchema,
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
  input: GetTaskCommentsInput,
): Promise<ApiResponse<PagedResponseOfTaskCommentDetailResponse>> {
  const parseResult = getTaskCommentsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await getTaskCommentsWithHeyApi(
      {
        workspaceId: parseResult.data.workspaceId,
        itemId: parseResult.data.itemId,
        taskId: parseResult.data.taskId,
      },
      {
        Page: parseResult.data.page ?? 1,
        CommentType: parseResult.data.commentType,
        IncludeDeleted: parseResult.data.includeDeleted,
      },
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
export async function getTaskComment(input: GetTaskCommentInput): Promise<ApiResponse<TaskCommentDetailResponse>> {
  const parseResult = getTaskCommentInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await getTaskCommentWithHeyApi(parseResult.data);

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
    const response = await createTaskCommentWithHeyApi(
      {
        workspaceId: parseResult.data.workspaceId,
        itemId: parseResult.data.itemId,
        taskId: parseResult.data.taskId,
      },
      {
        ...parseResult.data.request,
        commentType: parseResult.data.request.commentType ?? undefined,
      },
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
    const response = await updateTaskCommentWithHeyApi(
      {
        workspaceId: parseResult.data.workspaceId,
        itemId: parseResult.data.itemId,
        taskId: parseResult.data.taskId,
        commentId: parseResult.data.commentId,
      },
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
    const response = await deleteTaskCommentWithHeyApi(
      {
        workspaceId: parseResult.data.workspaceId,
        itemId: parseResult.data.itemId,
        taskId: parseResult.data.taskId,
        commentId: parseResult.data.commentId,
      },
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
