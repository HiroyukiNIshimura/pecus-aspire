'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { DocumentTreeResponse } from '@/connectors/api/pecus';
import {
  type UpdateItemParentInput,
  type UpdateSiblingOrderInput,
  updateItemParentInputSchema,
  updateSiblingOrderInputSchema,
} from '@/schemas/workspaceRelationSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

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
export async function updateItemParent(input: UpdateItemParentInput): Promise<ApiResponse<void>> {
  const parseResult = updateItemParentInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const { workspace } = createPecusApiClients();
    await workspace.putApiWorkspacesDocumentTreeParent(parseResult.data.workspaceId, parseResult.data.request);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('updateItemParent error:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: 'アイテムの移動に失敗しました。',
    });
  }
}

/**
 * ドキュメントツリー内の兄弟間ソート順を変更
 * @param workspaceId ワークスペースID
 * @param request 更新リクエスト
 */
export async function updateSiblingOrder(input: UpdateSiblingOrderInput): Promise<ApiResponse<void>> {
  const parseResult = updateSiblingOrderInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const { workspace } = createPecusApiClients();
    await workspace.putApiWorkspacesDocumentTreeSiblingOrder(parseResult.data.workspaceId, parseResult.data.request);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('updateSiblingOrder error:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: '並び順の変更に失敗しました。',
    });
  }
}
