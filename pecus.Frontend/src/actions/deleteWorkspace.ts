'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * ワークスペースを削除（Admin権限が必要）
 */
export async function deleteWorkspace(workspaceId: number): Promise<ApiResponse<void>> {
  try {
    const clients = await createPecusApiClients();
    await clients.workspace.deleteApiWorkspaces(workspaceId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    return handleApiErrorForAction<void>(error, { defaultMessage: 'ワークスペースの削除に失敗しました。' });
  }
}
