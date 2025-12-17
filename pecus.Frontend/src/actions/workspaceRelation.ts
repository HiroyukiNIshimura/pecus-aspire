'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { UpdateItemParentRequest, WorkspaceItemRelationsResponse } from '@/connectors/api/pecus';

/**
 * ワークスペース内の全アイテムリレーションを取得
 * @param workspaceId ワークスペースID
 */
export async function fetchWorkspaceRelations(workspaceId: number): Promise<WorkspaceItemRelationsResponse> {
  const { workspaceItem } = createPecusApiClients();
  const response = await workspaceItem.getApiWorkspacesRelations(workspaceId);
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
