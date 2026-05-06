'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  AddWorkspaceItemRelationResponse,
  PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics,
  RelationType,
  SuccessResponse,
  WorkspaceItemDetailResponse,
  WorkspaceItemResponse,
} from '@/connectors/api/pecus';
import {
  type AddWorkspaceItemRelationsInput,
  addWorkspaceItemRelationsInputSchema,
  type CreateWorkspaceItemInput,
  createWorkspaceItemInputSchema,
  type FetchChildrenCountInput,
  type FetchDocumentSuggestionInput,
  type FetchLatestWorkspaceItemInput,
  type FetchMyItemsInput,
  type FetchWorkspaceItemByCodeInput,
  fetchChildrenCountInputSchema,
  fetchDocumentSuggestionInputSchema,
  fetchLatestWorkspaceItemInputSchema,
  fetchMyItemsInputSchema,
  fetchWorkspaceItemByCodeInputSchema,
  type RemoveWorkspaceItemRelationInput,
  removeWorkspaceItemRelationInputSchema,
  type UpdateWorkspaceItemAssigneeInput,
  type UpdateWorkspaceItemAttributeInput,
  type UpdateWorkspaceItemInput,
  type UpdateWorkspaceItemStatusInput,
  updateWorkspaceItemAssigneeInputSchema,
  updateWorkspaceItemAttributeInputSchema,
  updateWorkspaceItemInputSchema,
  updateWorkspaceItemStatusInputSchema,
  type WorkspaceItemAttributeType,
  type WorkspaceItemPinInput,
  workspaceItemPinInputSchema,
} from '@/schemas/workspaceItemSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { serverError, validationError } from './types';

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
  input: FetchMyItemsInput,
): Promise<ApiResponse<PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics>> {
  const parseResult = fetchMyItemsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.my.getApiMyWorkspaceItems(
      parseResult.data.page ?? 1,
      parseResult.data.relation,
      parseResult.data.includeArchived,
      parseResult.data.workspaceIds,
      parseResult.data.sortBy ?? undefined,
      parseResult.data.order ?? undefined,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch my items:', error);
    return handleApiErrorForAction<PagedResponseOfWorkspaceItemDetailResponseAndWorkspaceItemStatistics>(error, {
      defaultMessage: 'マイアイテムの取得に失敗しました。',
    });
  }
}

/**
 * Server Action: 最新のワークスペースアイテムを取得
 */
export async function fetchLatestWorkspaceItem(
  input: FetchLatestWorkspaceItemInput,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  const parseResult = fetchLatestWorkspaceItemInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItems1(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspace item:', error);
    return handleApiErrorForAction<WorkspaceItemDetailResponse>(error, {
      defaultMessage: 'アイテムの取得に失敗しました。',
      handled: { not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムをコードで取得
 */
export async function fetchWorkspaceItemByCode(
  input: FetchWorkspaceItemByCodeInput,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  const parseResult = fetchWorkspaceItemByCodeInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsCode(
      parseResult.data.workspaceId,
      parseResult.data.itemCode,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspace item by code:', error);
    return handleApiErrorForAction<WorkspaceItemDetailResponse>(error, {
      defaultMessage: 'アイテムの取得に失敗しました。',
      handled: { not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムを作成
 */
export async function createWorkspaceItem(
  input: CreateWorkspaceItemInput,
): Promise<ApiResponse<WorkspaceItemResponse>> {
  const parseResult = createWorkspaceItemInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.postApiWorkspacesItems(
      parseResult.data.workspaceId,
      parseResult.data.request,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create workspace item:', error);
    return handleApiErrorForAction<WorkspaceItemResponse>(error, {
      defaultMessage: 'アイテムの作成に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムを更新
 */
export async function updateWorkspaceItem(
  input: UpdateWorkspaceItemInput,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  const parseResult = updateWorkspaceItemInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItems(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.request,
    );
    if (response.workspaceItem) {
      return { success: true, data: response.workspaceItem };
    }
    return serverError('アイテムの更新結果取得に失敗しました。');
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

    return handleApiErrorForAction<WorkspaceItemDetailResponse>(error, {
      defaultMessage: 'アイテムの更新に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムにPINを追加
 */
export async function addWorkspaceItemPin(
  input: WorkspaceItemPinInput,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  const parseResult = workspaceItemPinInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.postApiWorkspacesItemsPin(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
    );

    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return serverError('PIN操作の結果取得に失敗しました。');
  } catch (error) {
    console.error('Failed to add pin to workspace item:', error);
    return handleApiErrorForAction<WorkspaceItemDetailResponse>(error, {
      defaultMessage: 'PINの追加に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムからPINを削除
 */
export async function removeWorkspaceItemPin(
  input: WorkspaceItemPinInput,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  const parseResult = workspaceItemPinInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.deleteApiWorkspacesItemsPin(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
    );

    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return serverError('PIN操作の結果取得に失敗しました。');
  } catch (error) {
    console.error('Failed to remove pin from workspace item:', error);
    return handleApiErrorForAction<WorkspaceItemDetailResponse>(error, {
      defaultMessage: 'PINの削除に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムの担当者を更新
 */
export async function updateWorkspaceItemAssignee(
  input: UpdateWorkspaceItemAssigneeInput,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  const parseResult = updateWorkspaceItemAssigneeInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItemsAssignee(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.request,
    );

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

    return handleApiErrorForAction<WorkspaceItemDetailResponse>(error, {
      defaultMessage: '担当者の更新に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムのステータス（下書き/アーカイブ）を更新
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param request 更新リクエスト
 */
export async function updateWorkspaceItemStatus(
  input: UpdateWorkspaceItemStatusInput,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  const parseResult = updateWorkspaceItemStatusInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItemsStatus(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.request,
    );

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

    return handleApiErrorForAction<WorkspaceItemDetailResponse>(error, {
      defaultMessage: 'ステータスの更新に失敗しました。',
      handled: { validation: true, not_found: true },
    });
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
  input: UpdateWorkspaceItemAttributeInput,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  const parseResult = updateWorkspaceItemAttributeInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItems1(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.attribute,
      {
        value: parseResult.data.request.value,
        rowVersion: parseResult.data.request.rowVersion,
      },
    );

    // レスポンスからアイテムデータを取得
    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return serverError('アイテムの取得に失敗しました。');
  } catch (error) {
    console.error(`Failed to update workspace item ${parseResult.data.attribute}:`, error);

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

    // 属性名に応じたエラーメッセージ
    const attributeNames: Record<WorkspaceItemAttributeType, string> = {
      assignee: '担当者',
      committer: 'コミッター',
      priority: '優先度',
      duedate: '期限日',
      archive: 'アーカイブ状態',
    };
    const attrName = attributeNames[parseResult.data.attribute] || parseResult.data.attribute;

    return handleApiErrorForAction<WorkspaceItemDetailResponse>(error, {
      defaultMessage: `${attrName}の更新に失敗しました。`,
      handled: { validation: true, not_found: true },
    });
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
  input: AddWorkspaceItemRelationsInput,
): Promise<ApiResponse<AddWorkspaceItemRelationResponse[]>> {
  const parseResult = addWorkspaceItemRelationsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();

    // 全ての関連追加を並列で実行
    const results = await Promise.all(
      parseResult.data.toItemIds.map((toItemId) =>
        api.workspaceItem.postApiWorkspacesItemsRelations(parseResult.data.workspaceId, parseResult.data.itemId, {
          toItemId,
          relationType: parseResult.data.relationType ?? ('Related' as RelationType),
        }),
      ),
    );

    return { success: true, data: results };
  } catch (error) {
    console.error('Failed to add workspace item relations:', error);
    return handleApiErrorForAction<AddWorkspaceItemRelationResponse[]>(error, {
      defaultMessage: '関連アイテムの追加に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムの関連を削除
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param relationId 関連ID
 */
export async function removeWorkspaceItemRelation(
  input: RemoveWorkspaceItemRelationInput,
): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = removeWorkspaceItemRelationInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.deleteApiWorkspacesItemsRelations(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.relationId,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to remove workspace item relation:', error);
    return handleApiErrorForAction<SuccessResponse>(error, {
      defaultMessage: '関連アイテムの削除に失敗しました。',
      handled: { not_found: true },
    });
  }
}

/**
 * Server Action: アイテムの子アイテム数を取得（ドキュメントモード用）
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 */
export async function fetchChildrenCount(
  input: FetchChildrenCountInput,
): Promise<ApiResponse<{ childrenCount: number; totalDescendantsCount: number }>> {
  const parseResult = fetchChildrenCountInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsChildrenCount(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
    );
    return {
      success: true,
      data: {
        childrenCount: response.childrenCount ?? 0,
        totalDescendantsCount: response.totalDescendantsCount ?? 0,
      },
    };
  } catch (error) {
    console.error('Failed to fetch children count:', error);
    return handleApiErrorForAction<{ childrenCount: number; totalDescendantsCount: number }>(error, {
      defaultMessage: '子アイテム数の取得に失敗しました。',
      handled: { not_found: true },
    });
  }
}

/**
 * Server Action: ドキュメント提案を取得
 * AIが件名から本文の提案を生成する
 * @param workspaceId ワークスペースID
 * @param title 件名
 */
export async function fetchDocumentSuggestion(
  input: FetchDocumentSuggestionInput,
): Promise<ApiResponse<{ suggestedContent: string }>> {
  const parseResult = fetchDocumentSuggestionInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.postApiWorkspacesItemsDocumentSuggestion(parseResult.data.workspaceId, {
      title: parseResult.data.title,
    });
    return {
      success: true,
      data: {
        suggestedContent: response.suggestedContent ?? '',
      },
    };
  } catch (error) {
    console.error('Failed to fetch document suggestion:', error);
    return handleApiErrorForAction<{ suggestedContent: string }>(error, {
      defaultMessage: 'ドキュメント提案の取得に失敗しました。',
      handled: { not_found: true },
    });
  }
}
