'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { DocumentTreeResponse, UpdateItemParentRequest } from '@/connectors/api/pecus';

/**
 * ドキュメントツリーを取得
 * ワークスペース内の全アイテムと親子関係を解決して返す
 * @param workspaceId ワークスペースID
 */
export async function fetchDocumentTree(workspaceId: number): Promise<DocumentTreeResponse> {
  const { workspace } = createPecusApiClients();
  const response = await workspace.getApiWorkspacesDocumentTree(workspaceId);
  return response;
}

/**
 * アイテムの親を変更（移動）
 * @param workspaceId ワークスペースID
 * @param request 更新リクエスト
 */
export async function updateItemParent(workspaceId: number, request: UpdateItemParentRequest): Promise<void> {
  const { workspaceItem } = createPecusApiClients();
  await workspaceItem.putApiWorkspacesRelationsParent(workspaceId, request);
}
