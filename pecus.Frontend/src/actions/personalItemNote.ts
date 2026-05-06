'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type { PersonalItemNoteResponse } from '@/connectors/api/pecus';
import {
  type CreatePersonalItemNoteInput,
  createPersonalItemNoteInputSchema,
  type DeletePersonalItemNoteInput,
  deletePersonalItemNoteInputSchema,
  type UpdatePersonalItemNoteInput,
  updatePersonalItemNoteInputSchema,
} from '@/schemas/personalItemNoteSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { serverError, validationError } from './types';

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
  input: CreatePersonalItemNoteInput,
): Promise<ApiResponse<PersonalItemNoteResponse>> {
  const parseResult = createPersonalItemNoteInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const data = await api.personalItemNote.postApiWorkspacesItemsPersonalNote(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      { content: parseResult.data.content },
    );
    return { success: true, data };
  } catch (error) {
    return handleApiErrorForAction<PersonalItemNoteResponse>(error, {
      defaultMessage: '個人メモの作成に失敗しました。',
      handled: { validation: true },
    });
  }
}

export async function updatePersonalItemNote(
  input: UpdatePersonalItemNoteInput,
): Promise<ApiResponse<PersonalItemNoteResponse>> {
  const parseResult = updatePersonalItemNoteInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const data = await api.personalItemNote.putApiWorkspacesItemsPersonalNote(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      { content: parseResult.data.content },
    );
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

export async function deletePersonalItemNote(input: DeletePersonalItemNoteInput): Promise<ApiResponse<null>> {
  const parseResult = deletePersonalItemNoteInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    await api.personalItemNote.deleteApiWorkspacesItemsPersonalNote(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
    );
    return { success: true, data: null };
  } catch (error) {
    return handleApiErrorForAction<null>(error, {
      defaultMessage: '個人メモの削除に失敗しました。',
    });
  }
}
