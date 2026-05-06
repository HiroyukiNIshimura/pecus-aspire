'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  AssigneeTaskLoadResponse,
  BulkCreateTasksResponse,
  PagedResponseOfWorkspaceTaskDetailResponseAndWorkspaceTaskStatistics,
  SortOrder,
  TaskGenerationResponse,
  TaskSortBy,
  TaskStatusFilter,
  WorkspaceTaskDetailResponse,
  WorkspaceTaskResponse,
} from '@/connectors/api/pecus';
import {
  type BulkCreateTasksInput,
  bulkCreateTasksInputSchema,
  type CheckAssigneeTaskLoadInput,
  type CreateWorkspaceTaskActionInput,
  checkAssigneeTaskLoadInputSchema,
  createWorkspaceTaskActionInputSchema,
  type GenerateTaskCandidatesInput,
  generateTaskCandidatesInputSchema,
  type UpdateWorkspaceTaskActionInput,
  updateWorkspaceTaskActionInputSchema,
} from '@/schemas/workspaceTaskSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

/**
 * シーケンス番号でタスクを1件取得
 */
export async function getWorkspaceTaskBySequence(
  workspaceId: number,
  itemId: number,
  sequence: number,
): Promise<ApiResponse<WorkspaceTaskDetailResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.getApiWorkspacesItemsTasksSequence(workspaceId, itemId, sequence);

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to get task by sequence:', error);
    return handleApiErrorForAction<WorkspaceTaskDetailResponse>(error, {
      defaultMessage: 'タスクの取得に失敗しました',
    });
  }
}

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
  sortBy?: TaskSortBy,
  order?: SortOrder,
): Promise<ApiResponse<PagedResponseOfWorkspaceTaskDetailResponseAndWorkspaceTaskStatistics>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.getApiWorkspacesItemsTasks(
      workspaceId,
      itemId,
      page,
      pageSize,
      status,
      assignedUserId,
      sortBy,
      order,
    );

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to get workspace tasks:', error);
    return handleApiErrorForAction<PagedResponseOfWorkspaceTaskDetailResponseAndWorkspaceTaskStatistics>(error, {
      defaultMessage: 'タスク一覧の取得に失敗しました',
    });
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
    console.error('Failed to get all workspace tasks:', error);
    return handleApiErrorForAction<WorkspaceTaskDetailResponse[]>(error, {
      defaultMessage: 'タスク一覧の取得に失敗しました',
    });
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
    console.error('Failed to get workspace task:', error);
    return handleApiErrorForAction<WorkspaceTaskDetailResponse>(error, {
      defaultMessage: 'タスクの取得に失敗しました',
    });
  }
}

/**
 * ワークスペースタスクを作成
 */
export async function createWorkspaceTask(
  input: CreateWorkspaceTaskActionInput,
): Promise<ApiResponse<WorkspaceTaskResponse>> {
  const parseResult = createWorkspaceTaskActionInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.postApiWorkspacesItemsTasks(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.request,
    );

    return { success: true, data: response };
  } catch (error: unknown) {
    console.error('Failed to create workspace task:', error);
    return handleApiErrorForAction<WorkspaceTaskResponse>(error, {
      defaultMessage: 'タスクの作成に失敗しました',
    });
  }
}

/**
 * ワークスペースタスクを更新
 */
export async function updateWorkspaceTask(
  input: UpdateWorkspaceTaskActionInput,
): Promise<ApiResponse<WorkspaceTaskResponse>> {
  const parseResult = updateWorkspaceTaskActionInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.putApiWorkspacesItemsTasks(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.taskId,
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
              type: 'workspaceTask',
              data: concurrencyError.payload.current as WorkspaceTaskDetailResponse,
            }
          : undefined,
      };
    }

    console.error('Failed to update workspace task:', error);
    return handleApiErrorForAction<WorkspaceTaskResponse>(error, {
      defaultMessage: 'タスクの更新に失敗しました',
    });
  }
}

/**
 * 担当者の期限日別タスク負荷をチェック
 */
export async function checkAssigneeTaskLoad(
  input: CheckAssigneeTaskLoadInput,
): Promise<ApiResponse<AssigneeTaskLoadResponse>> {
  const parseResult = checkAssigneeTaskLoadInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.getApiWorkspacesItemsTasksAssigneeLoadCheck(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.assignedUserId,
      parseResult.data.dueDate,
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to check assignee task load:', error);
    return handleApiErrorForAction<AssigneeTaskLoadResponse>(error, {
      defaultMessage: '担当者のタスク負荷の確認に失敗しました',
    });
  }
}

/** 先行タスク候補として使用するシンプルなタスク情報 */
export interface PredecessorTaskOption {
  id: number;
  sequence: number;
  content: string;
  isCompleted: boolean;
  dueDate: string | null;
}

/**
 * 先行タスク選択用のタスク一覧を取得（アクティブなタスクのみ）
 * @param workspaceId ワークスペースID
 * @param itemId ワークスペースアイテムID
 * @param excludeTaskId 除外するタスクID（編集中の自タスク）
 */
export async function getPredecessorTaskOptions(
  workspaceId: number,
  itemId: number,
  excludeTaskId?: number,
): Promise<ApiResponse<PredecessorTaskOption[]>> {
  try {
    const api = await createPecusApiClients();
    const pageSize = 50; // APIの上限
    let allTasks: PredecessorTaskOption[] = [];
    let currentPage = 1;
    let hasMore = true;

    // 全ページを取得するまでループ
    while (hasMore) {
      const response = await api.workspaceTask.getApiWorkspacesItemsTasks(
        workspaceId,
        itemId,
        currentPage,
        pageSize,
        'All', // 全タスク（Active + Completed + Discarded）
      );

      const pageTasks = (response.data || [])
        .filter((t) => t.id !== excludeTaskId && !t.isDiscarded) // 自タスクと破棄タスクを除外
        .map((t) => ({
          id: t.id,
          sequence: t.sequence || 0,
          content: t.content || '',
          isCompleted: t.isCompleted || false,
          dueDate: t.dueDate || null,
        }));

      allTasks = [...allTasks, ...pageTasks];

      // 次のページがあるかチェック
      const totalCount = response.totalCount || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      hasMore = currentPage < totalPages;
      currentPage++;
    }

    return { success: true, data: allTasks };
  } catch (error) {
    console.error('Failed to get predecessor task options:', error);
    return handleApiErrorForAction<PredecessorTaskOption[]>(error, {
      defaultMessage: '先行タスク一覧の取得に失敗しました',
    });
  }
}

/**
 * タスクフローマップを取得
 * アイテム内のタスク依存関係を可視化するためのデータを取得
 */
export async function getTaskFlowMap(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<import('@/connectors/api/pecus').TaskFlowMapResponse>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.getApiWorkspacesItemsTasksFlowMap(workspaceId, itemId);

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to get task flow map:', error);
    return handleApiErrorForAction<import('@/connectors/api/pecus').TaskFlowMapResponse>(error, {
      defaultMessage: 'タスクフローマップの取得に失敗しました',
    });
  }
}

/**
 * タスク内容提案を取得
 * AIがアイテム情報とタスクタイプからタスク内容を提案（プレーンテキスト）
 */
export async function fetchTaskContentSuggestion(
  workspaceId: number,
  itemId: number,
  taskTypeId: number,
): Promise<ApiResponse<{ suggestedContent: string }>> {
  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.postApiWorkspacesItemsTasksContentSuggestion(workspaceId, itemId, {
      taskTypeId,
    });

    return {
      success: true,
      data: {
        suggestedContent: response.suggestedContent ?? '',
      },
    };
  } catch (error) {
    console.error('Failed to fetch task content suggestion:', error);
    return handleApiErrorForAction<{ suggestedContent: string }>(error, {
      defaultMessage: 'タスク内容提案の取得に失敗しました。',
      handled: { not_found: true },
    });
  }
}

/**
 * AIによるタスク候補生成
 * アイテム情報からタスク候補を自動生成する
 */
export async function generateTaskCandidates(
  input: GenerateTaskCandidatesInput,
): Promise<ApiResponse<TaskGenerationResponse>> {
  const parseResult = generateTaskCandidatesInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.postApiWorkspacesItemsTasksGenerateCandidates(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.request,
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to generate task candidates:', error);
    return handleApiErrorForAction<TaskGenerationResponse>(error, {
      defaultMessage: 'タスク候補の生成に失敗しました。',
      handled: { not_found: true },
    });
  }
}

/**
 * タスク一括作成
 * 承認されたタスク候補を一括で作成する
 */
export async function bulkCreateTasks(input: BulkCreateTasksInput): Promise<ApiResponse<BulkCreateTasksResponse>> {
  const parseResult = bulkCreateTasksInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const response = await api.workspaceTask.postApiWorkspacesItemsTasksBulkCreate(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.request,
    );

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to bulk create tasks:', error);
    return handleApiErrorForAction<BulkCreateTasksResponse>(error, {
      defaultMessage: 'タスクの一括作成に失敗しました。',
      handled: { not_found: true },
    });
  }
}
