'use server';

import {
  createPecusApiClients,
  detect400ValidationError,
  detect404ValidationError,
  detectConcurrencyError,
  parseErrorResponse,
} from '@/connectors/api/PecusApiClient';
import type {
  AddWorkspaceItemRelationResponse,
  CreateWorkspaceItemRequest,
  ItemSortBy,
  MyItemRelationType,
  PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics,
  RelationType,
  SortOrder,
  SuccessResponse,
  UpdateWorkspaceItemAssigneeRequest,
  UpdateWorkspaceItemAttributeRequest,
  UpdateWorkspaceItemRequest,
  UpdateWorkspaceItemStatusRequest,
  WorkspaceItemDetailResponse,
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
 * @param workspaceIds ワークスペースIDの配列（フィルタリング用）
 * @param sortBy ソート項目（CreatedAt, UpdatedAt, Priority, DueDate）
 * @param order ソート順序（Asc, Desc）
 */
export async function fetchMyItems(
  page: number = 1,
  relation?: MyItemRelationType,
  includeArchived?: boolean,
  workspaceIds?: number[],
  sortBy?: ItemSortBy,
  order?: SortOrder,
): Promise<ApiResponse<PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics>> {
  try {
    const api = createPecusApiClients();
    const response = await api.my.getApiMyWorkspaceItems(
      page,
      relation,
      includeArchived,
      workspaceIds,
      sortBy ?? undefined,
      order ?? undefined,
    );
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
 * Server Action: ワークスペースアイテムをコードで取得
 */
export async function fetchWorkspaceItemByCode(
  workspaceId: number,
  itemCode: string,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsCode(workspaceId, itemCode);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspace item by code:', error);

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
 * Server Action: ワークスペースアイテムのステータス（下書き/アーカイブ）を更新
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param request 更新リクエスト
 */
export async function updateWorkspaceItemStatus(
  workspaceId: number,
  itemId: number,
  request: UpdateWorkspaceItemStatusRequest,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItemsStatus(workspaceId, itemId, request);

    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return serverError('アイテムの取得に失敗しました。');
  } catch (error) {
    console.error('Failed to update workspace item status:', error);

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

    return parseErrorResponse(error, 'ステータスの更新に失敗しました。');
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

/**
 * Server Action: ワークスペースアイテムに関連を追加（複数対応）
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID（関連元）
 * @param toItemIds 関連先アイテムIDの配列
 * @param relationType 関連タイプ（デフォルト: Related）
 */
export async function addWorkspaceItemRelations(
  workspaceId: number,
  itemId: number,
  toItemIds: number[],
  relationType: RelationType = 'Related',
): Promise<ApiResponse<AddWorkspaceItemRelationResponse[]>> {
  try {
    const api = createPecusApiClients();

    // 全ての関連追加を並列で実行
    const results = await Promise.all(
      toItemIds.map((toItemId) =>
        api.workspaceItem.postApiWorkspacesItemsRelations(workspaceId, itemId, {
          toItemId,
          relationType,
        }),
      ),
    );

    return { success: true, data: results };
  } catch (error) {
    console.error('Failed to add workspace item relations:', error);

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, '関連アイテムの追加に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースアイテムの関連を削除
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param relationId 関連ID
 */
export async function removeWorkspaceItemRelation(
  workspaceId: number,
  itemId: number,
  relationId: number,
): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.deleteApiWorkspacesItemsRelations(workspaceId, itemId, relationId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to remove workspace item relation:', error);

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, '関連アイテムの削除に失敗しました。');
  }
}

/**
 * エクスポートフォーマット
 */
export type ExportFormat = 'markdown' | 'html' | 'json';

/**
 * Server Action: ワークスペースアイテムをMarkdown形式でエクスポート
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 */
export async function exportWorkspaceItemMarkdown(workspaceId: number, itemId: number): Promise<ApiResponse<string>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsExportMarkdown(workspaceId, itemId);
    return { success: true, data: response as string };
  } catch (error) {
    console.error('Failed to export workspace item as markdown:', error);

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'Markdownエクスポートに失敗しました。');
  }
}

/**
 * Server Action: ワークスペースアイテムをHTML形式でエクスポート
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 */
export async function exportWorkspaceItemHtml(workspaceId: number, itemId: number): Promise<ApiResponse<string>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsExportHtml(workspaceId, itemId);
    return { success: true, data: response as string };
  } catch (error) {
    console.error('Failed to export workspace item as HTML:', error);

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'HTMLエクスポートに失敗しました。');
  }
}

/**
 * Server Action: ワークスペースアイテムをJSON形式でエクスポート（Node データ）
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 */
export async function exportWorkspaceItemJson(workspaceId: number, itemId: number): Promise<ApiResponse<unknown>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsExportJson(workspaceId, itemId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to export workspace item as JSON:', error);

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'JSONエクスポートに失敗しました。');
  }
}

/**
 * Server Action: アイテムの子アイテム数を取得（ドキュメントモード用）
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 */
export async function fetchChildrenCount(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<{ childrenCount: number; totalDescendantsCount: number }>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsChildrenCount(workspaceId, itemId);
    return {
      success: true,
      data: {
        childrenCount: response.childrenCount ?? 0,
        totalDescendantsCount: response.totalDescendantsCount ?? 0,
      },
    };
  } catch (error) {
    console.error('Failed to fetch children count:', error);

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, '子アイテム数の取得に失敗しました。');
  }
}

/**
 * Server Action: ドキュメント提案を取得
 * AIが件名から本文の提案を生成する
 * @param workspaceId ワークスペースID
 * @param title 件名
 */
export async function fetchDocumentSuggestion(
  workspaceId: number,
  title: string,
): Promise<ApiResponse<{ suggestedContent: string }>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.postApiWorkspacesItemsDocumentSuggestion(workspaceId, { title });
    return {
      success: true,
      data: {
        suggestedContent: response.suggestedContent ?? '',
      },
    };
  } catch (error) {
    console.error('Failed to fetch document suggestion:', error);

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'ドキュメント提案の取得に失敗しました。');
  }
}
