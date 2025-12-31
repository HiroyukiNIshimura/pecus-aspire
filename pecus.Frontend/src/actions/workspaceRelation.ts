'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { DocumentTreeResponse, UpdateItemParentRequest } from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * ドキュメントツリーを取得
 * ワークスペース内の全アイテムと親子関係を解決して返す
 * @param workspaceId ワークスペースID
 */
export async function fetchDocumentTree(workspaceId: number): Promise<ApiResponse<DocumentTreeResponse>> {
  try {
    const { workspace } = createPecusApiClients();
    const response = await workspace.getApiWorkspacesDocumentTree(workspaceId);
    return { success: true, data: response };
  } catch (error) {
    console.error('fetchDocumentTree error:', error);
    return handleApiErrorForAction<DocumentTreeResponse>(error, {
      defaultMessage: 'ドキュメントツリーの取得に失敗しました。',
    });
  }
}

/**
 * アイテムの親を変更（移動）
 * @param workspaceId ワークスペースID
 * @param request 更新リクエスト
 */
export async function updateItemParent(
  workspaceId: number,
  request: UpdateItemParentRequest,
): Promise<ApiResponse<void>> {
  try {
    const { workspaceItem } = createPecusApiClients();
    await workspaceItem.putApiWorkspacesRelationsParent(workspaceId, request);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('updateItemParent error:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: 'アイテムの移動に失敗しました。',
    });
  }
}
