'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  PagedResponseOfTagListItemResponseAndTagStatistics,
  SuccessResponse,
  TagDetailResponse,
  TagResponse,
} from '@/connectors/api/pecus';
import {
  type ActivateTagInput,
  activateTagInputSchema,
  type CreateTagInput,
  createTagInputSchema,
  type DeactivateTagInput,
  type DeleteTagInput,
  deactivateTagInputSchema,
  deleteTagInputSchema,
  type UpdateTagInput,
  updateTagInputSchema,
} from '@/schemas/adminTagSchemas';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';
import { validationError } from '../types';

/**
 * Server Action: タグ一覧を取得（ページネーション対応）
 */
export async function getTags(
  page: number = 1,
  isActive: boolean = true,
): Promise<ApiResponse<PagedResponseOfTagListItemResponseAndTagStatistics>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.getApiAdminTags(page, isActive);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'タグ一覧の取得に失敗しました' });
  }
}

/**
 * Server Action: タグ情報を取得
 */
export async function getTagDetail(id: number): Promise<ApiResponse<TagDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.getApiAdminTags1(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch tag detail:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'タグ情報の取得に失敗しました' });
  }
}

/**
 * Server Action: タグを作成
 */
export async function createTag(input: CreateTagInput): Promise<ApiResponse<TagResponse>> {
  const parseResult = createTagInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.postApiAdminTags(parseResult.data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create tag:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'タグの作成に失敗しました' });
  }
}

/**
 * Server Action: タグを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateTag(input: UpdateTagInput): Promise<ApiResponse<TagResponse | TagDetailResponse>> {
  const parseResult = updateTagInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    let response = await api.adminTag.putApiAdminTags(parseResult.data.id, {
      name: parseResult.data.name,
      rowVersion: parseResult.data.rowVersion,
    });

    // isActive が指定されている場合、activate/deactivate を呼び出す
    if (parseResult.data.isActive !== undefined) {
      if (parseResult.data.isActive) {
        response = await api.adminTag.patchApiAdminTagsActivate(parseResult.data.id);
      } else {
        response = await api.adminTag.patchApiAdminTagsDeactivate(parseResult.data.id);
      }
    }

    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as TagDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: current
          ? {
              type: 'tag',
              data: current,
            }
          : undefined,
      };
    }

    console.error('Failed to update tag:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'タグの更新に失敗しました' });
  }
}

/**
 * Server Action: タグを削除
 */
export async function deleteTag(input: DeleteTagInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = deleteTagInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.deleteApiAdminTags(parseResult.data.id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to delete tag:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'タグの削除に失敗しました' });
  }
}

/**
 * Server Action: タグを有効化
 */
export async function activateTag(input: ActivateTagInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = activateTagInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.patchApiAdminTagsActivate(parseResult.data.id);
    return { success: true, data: response };
  } catch (error) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as TagDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: current
          ? {
              type: 'tag',
              data: current,
            }
          : undefined,
      };
    }
    console.error('Failed to activate tag:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'タグの有効化に失敗しました' });
  }
}

/**
 * Server Action: タグを無効化
 */
export async function deactivateTag(input: DeactivateTagInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = deactivateTagInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.patchApiAdminTagsDeactivate(parseResult.data.id);
    return { success: true, data: response };
  } catch (error) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as TagDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: current
          ? {
              type: 'tag',
              data: current,
            }
          : undefined,
      };
    }
    console.error('Failed to deactivate tag:', error);

    return handleApiErrorForAction(error, { defaultMessage: 'タグの無効化に失敗しました' });
  }
}
