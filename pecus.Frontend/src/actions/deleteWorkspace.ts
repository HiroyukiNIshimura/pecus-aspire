'use server';

import { deleteWorkspaceWithHeyApi } from '@/connectors/HeyApiClient';
import { type DeleteWorkspaceInput, deleteWorkspaceInputSchema } from '@/schemas/workspaceSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

/**
 * ワークスペースを削除（Admin権限が必要）
 */
export async function deleteWorkspace(input: DeleteWorkspaceInput): Promise<ApiResponse<void>> {
  const parseResult = deleteWorkspaceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    await deleteWorkspaceWithHeyApi(parseResult.data.workspaceId);

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    return handleApiErrorForAction<void>(error, { defaultMessage: 'ワークスペースの削除に失敗しました。' });
  }
}
