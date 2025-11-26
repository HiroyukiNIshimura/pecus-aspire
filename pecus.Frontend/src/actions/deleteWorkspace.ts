'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { ApiResponse } from './types';

/**
 * ワークスペースを削除（Admin権限が必要）
 */
export async function deleteWorkspace(workspaceId: number): Promise<ApiResponse<void>> {
  try {
    const clients = await createPecusApiClients();
    await clients.workspace.deleteApiWorkspaces(workspaceId);

    return { success: true, data: undefined };
  } catch (error: any) {
    return {
      success: false,
      error: 'server',
      message: error.body?.message || error.message || 'ワークスペースの削除に失敗しました。',
    };
  }
}
