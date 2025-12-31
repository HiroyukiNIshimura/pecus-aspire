'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { WorkspaceItemAttachmentResponse } from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * Server Action: ワークスペースアイテムの添付ファイル一覧を取得
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 */
export async function fetchWorkspaceItemAttachments(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<WorkspaceItemAttachmentResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsAttachments(workspaceId, itemId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspace item attachments:', error);
    return handleApiErrorForAction<WorkspaceItemAttachmentResponse[]>(error, {
      defaultMessage: '添付ファイル一覧の取得に失敗しました。',
      handled: { not_found: true },
    });
  }
}

/**
 * Server Action: 添付ファイルを削除
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param attachmentId 添付ファイルID
 */
export async function deleteWorkspaceItemAttachment(
  workspaceId: number,
  itemId: number,
  attachmentId: number,
): Promise<ApiResponse<void>> {
  try {
    const api = createPecusApiClients();
    await api.workspaceItem.deleteApiWorkspacesItemsAttachments(workspaceId, itemId, attachmentId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete workspace item attachment:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: '添付ファイルの削除に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}
