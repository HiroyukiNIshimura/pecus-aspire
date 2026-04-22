'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type { PersonalItemNoteResponse } from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { serverError } from './types';

export async function fetchPersonalItemNote(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<PersonalItemNoteResponse | null>> {
  try {
    const api = createPecusApiClients();
    const data = await api.personalItemNote.getApiWorkspacesItemsPersonalNote(workspaceId, itemId);
    return { success: true, data };
  } catch (error) {
    const result = handleApiErrorForAction<PersonalItemNoteResponse | null>(error, {
      defaultMessage: '個人メモの取得に失敗しました。',
      handled: { not_found: true },
    });
    if (!result.success && result.error === 'not_found') {
      return { success: true, data: null };
    }
    return result;
  }
}

export async function createPersonalItemNote(
  workspaceId: number,
  itemId: number,
  content: string,
): Promise<ApiResponse<PersonalItemNoteResponse>> {
  try {
    const api = createPecusApiClients();
    const data = await api.personalItemNote.postApiWorkspacesItemsPersonalNote(workspaceId, itemId, { content });
    return { success: true, data };
  } catch (error) {
    return handleApiErrorForAction<PersonalItemNoteResponse>(error, {
      defaultMessage: '個人メモの作成に失敗しました。',
      handled: { validation: true },
    });
  }
}

export async function updatePersonalItemNote(
  workspaceId: number,
  itemId: number,
  content: string,
): Promise<ApiResponse<PersonalItemNoteResponse>> {
  try {
    const api = createPecusApiClients();
    const data = await api.personalItemNote.putApiWorkspacesItemsPersonalNote(workspaceId, itemId, { content });
    return { success: true, data };
  } catch (error) {
    const concurrency = detectConcurrencyError(error);
    if (concurrency) {
      return serverError<PersonalItemNoteResponse>(concurrency.message);
    }
    return handleApiErrorForAction<PersonalItemNoteResponse>(error, {
      defaultMessage: '個人メモの更新に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}

export async function deletePersonalItemNote(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<null>> {
  try {
    const api = createPecusApiClients();
    await api.personalItemNote.deleteApiWorkspacesItemsPersonalNote(workspaceId, itemId);
    return { success: true, data: null };
  } catch (error) {
    return handleApiErrorForAction<null>(error, {
      defaultMessage: '個人メモの削除に失敗しました。',
    });
  }
}
