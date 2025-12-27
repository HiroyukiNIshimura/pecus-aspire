'use server';

import {
  createPecusApiClients,
  detect400ValidationError,
  detect404ValidationError,
  parseErrorResponse,
} from '@/connectors/api/PecusApiClient';
import type { WorkspaceItemAttachmentResponse } from '@/connectors/api/pecus';
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

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, '添付ファイル一覧の取得に失敗しました。');
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

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, '添付ファイルの削除に失敗しました。');
  }
}
