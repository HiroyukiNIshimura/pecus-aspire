'use server';

import {
  getWorkspaceDocumentTreeWithHeyApi,
  updateWorkspaceDocumentTreeParentWithHeyApi,
  updateWorkspaceDocumentTreeSiblingOrderWithHeyApi,
} from '@/connectors/HeyApiClient';
import type { DocumentTreeResponse } from '@/connectors/hey-api-axios/types.gen';
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
    const response = await getWorkspaceDocumentTreeWithHeyApi(workspaceId);
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
    await updateWorkspaceDocumentTreeParentWithHeyApi(parseResult.data.workspaceId, parseResult.data.request);
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
    await updateWorkspaceDocumentTreeSiblingOrderWithHeyApi(parseResult.data.workspaceId, parseResult.data.request);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('updateSiblingOrder error:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: '並び順の変更に失敗しました。',
    });
  }
}
