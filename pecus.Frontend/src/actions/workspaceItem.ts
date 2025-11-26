'use server';

import {
  createPecusApiClients,
  detect400ValidationError,
  detect404ValidationError,
  detectConcurrencyError,
  parseErrorResponse,
} from '@/connectors/api/PecusApiClient';
import type {
  CreateWorkspaceItemRequest,
  UpdateWorkspaceItemAssigneeRequest,
  UpdateWorkspaceItemRequest,
  WorkspaceItemDetailResponse,
  WorkspaceItemResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from './types';
import { serverError } from './types';

/**
 * Server Action: 最新のワークスペースアイテムを取得
 */
export async function fetchLatestWorkspaceItem(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItems1(workspaceId, itemId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspace item:', error);

    const notFound = detect404ValidationError(error);
    // アイテムが見つからない（404 Not Found）
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'アイテムの取得に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースアイテムを作成
 */
export async function createWorkspaceItem(
  workspaceId: number,
  request: CreateWorkspaceItemRequest,
): Promise<ApiResponse<WorkspaceItemResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.postApiWorkspacesItems(workspaceId, request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create workspace item:', error);

    const badRequest = detect400ValidationError(error);
    // バリデーションエラー
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    // アイテムが見つからない（404 Not Found）
    if (notFound) {
      return notFound;
    }
    // その他のエラー
    return parseErrorResponse(error, 'アイテムの作成に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースアイテムを更新
 */
export async function updateWorkspaceItem(
  workspaceId: number,
  itemId: number,
  request: UpdateWorkspaceItemRequest,
): Promise<ApiResponse<WorkspaceItemResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItems(workspaceId, itemId, request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update workspace item:', error);

    // 409 Conflict: 並行更新による競合
    const concurrency = detectConcurrencyError(error);
    if (concurrency) {
      return {
        success: false,
        error: 'conflict',
        message: concurrency.message,
        latest: {
          type: 'workspaceItem',
          data: concurrency.payload.current as WorkspaceItemDetailResponse,
        },
      };
    }

    // バリデーションエラー
    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      // バリデーションエラー
      return badRequest;
    }
    const notFound = detect404ValidationError(error);
    // アイテムが見つからない（404 Not Found）
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'アイテムの更新に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースアイテムの作業者を更新
 */
export async function updateWorkspaceItemAssignee(
  workspaceId: number,
  itemId: number,
  request: UpdateWorkspaceItemAssigneeRequest,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItemsAssignee(workspaceId, itemId, request);

    // レスポンスからアイテムデータを取得
    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return serverError('アイテムの取得に失敗しました。');
  } catch (error) {
    console.error('Failed to update workspace item assignee:', error);

    // 409 Conflict: 並行更新による競合
    const concurrency = detectConcurrencyError(error);
    if (concurrency) {
      return {
        success: false,
        error: 'conflict',
        message: concurrency.message,
        latest:
          concurrency.payload.current && typeof concurrency.payload.current === 'object'
            ? {
                type: 'workspaceItem',
                data: concurrency.payload.current as WorkspaceItemDetailResponse,
              }
            : undefined,
      };
    }

    // バリデーションエラー
    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      // バリデーションエラー
      return badRequest;
    }
    const notFound = detect404ValidationError(error);
    if (notFound) {
      // アイテムが見つからない（404 Not Found）
      return notFound;
    }

    // その他のエラー
    return parseErrorResponse(error, '担当者の更新に失敗しました。');
  }
}
