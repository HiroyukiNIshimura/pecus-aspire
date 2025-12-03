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
  MyItemRelationType,
  UpdateWorkspaceItemAssigneeRequest,
  UpdateWorkspaceItemAttributeRequest,
  UpdateWorkspaceItemRequest,
  WorkspaceItemDetailResponse,
  WorkspaceItemDetailResponsePagedResponse,
  WorkspaceItemResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from './types';
import { serverError } from './types';

/**
 * ワークスペースアイテム属性の種類
 */
export type WorkspaceItemAttributeType = 'assignee' | 'committer' | 'priority' | 'duedate' | 'archive';

/**
 * Server Action: マイアイテム一覧を取得（ワークスペース横断）
 * @param page ページ番号
 * @param relation 関連タイプ（All, Owner, Assignee, Committer, Pinned）
 * @param includeArchived アーカイブ済みアイテムを含めるかどうか（true: アーカイブ済みのみ、false/undefined: アーカイブ除外）
 */
export async function fetchMyItems(
  page: number = 1,
  relation?: MyItemRelationType,
  includeArchived?: boolean,
): Promise<ApiResponse<WorkspaceItemDetailResponsePagedResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.myWorkspaceItem.getApiMyWorkspaceItems(page, relation, includeArchived);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch my items:', error);
    return parseErrorResponse(error, 'マイアイテムの取得に失敗しました。');
  }
}

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
 * Server Action: ワークスペースアイテムにPINを追加
 */
export async function addWorkspaceItemPin(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.postApiWorkspacesItemsPin(workspaceId, itemId);

    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return serverError('PIN操作の結果取得に失敗しました。');
  } catch (error) {
    console.error('Failed to add pin to workspace item:', error);

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'PINの追加に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースアイテムからPINを削除
 */
export async function removeWorkspaceItemPin(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.deleteApiWorkspacesItemsPin(workspaceId, itemId);

    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return serverError('PIN操作の結果取得に失敗しました。');
  } catch (error) {
    console.error('Failed to remove pin from workspace item:', error);

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'PINの削除に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースアイテムの担当者を更新
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

/**
 * Server Action: ワークスペースアイテムの属性を更新
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param attribute 属性名 (assignee, committer, priority, duedate, archive)
 * @param request 更新リクエスト
 */
export async function updateWorkspaceItemAttribute(
  workspaceId: number,
  itemId: number,
  attribute: WorkspaceItemAttributeType,
  request: UpdateWorkspaceItemAttributeRequest,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItems1(workspaceId, itemId, attribute, {
      value: request.value,
      rowVersion: request.rowVersion,
    });

    // レスポンスからアイテムデータを取得
    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return serverError('アイテムの取得に失敗しました。');
  } catch (error) {
    console.error(`Failed to update workspace item ${attribute}:`, error);

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
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    // 属性名に応じたエラーメッセージ
    const attributeNames: Record<WorkspaceItemAttributeType, string> = {
      assignee: '担当者',
      committer: 'コミッター',
      priority: '優先度',
      duedate: '期限日',
      archive: 'アーカイブ状態',
    };
    const attrName = attributeNames[attribute] || attribute;

    return parseErrorResponse(error, `${attrName}の更新に失敗しました。`);
  }
}
