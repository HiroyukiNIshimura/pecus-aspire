'use server';

import { createPecusApiClients, detectConcurrencyError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  PagedResponseOfTagListItemResponseAndTagStatistics,
  SuccessResponse,
  TagDetailResponse,
  TagResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from '../types';

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
    return parseErrorResponse(error, 'タグ一覧の取得に失敗しました');
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
    return parseErrorResponse(error, 'タグ情報の取得に失敗しました');
  }
}

/**
 * Server Action: タグを作成
 */
export async function createTag(request: { name: string; description?: string }): Promise<ApiResponse<TagResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.postApiAdminTags(request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create tag:', error);
    return parseErrorResponse(error, 'タグの作成に失敗しました');
  }
}

/**
 * Server Action: タグを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateTag(
  id: number,
  request: {
    name: string;
    isActive?: boolean;
    rowVersion: number; // 楽観的ロック用（PostgreSQL xmin）
  },
): Promise<ApiResponse<TagResponse | TagDetailResponse>> {
  try {
    const api = createPecusApiClients();
    let response = await api.adminTag.putApiAdminTags(id, {
      name: request.name,
      rowVersion: request.rowVersion,
    });

    // isActive が指定されている場合、activate/deactivate を呼び出す
    if (request.isActive !== undefined) {
      if (request.isActive) {
        response = await api.adminTag.patchApiAdminTagsActivate(id);
      } else {
        response = await api.adminTag.patchApiAdminTagsDeactivate(id);
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
        latest: {
          type: 'tag',
          data: current as TagDetailResponse,
        },
      };
    }

    console.error('Failed to update tag:', error);
    return parseErrorResponse(error, 'タグの更新に失敗しました');
  }
}

/**
 * Server Action: タグを削除
 */
export async function deleteTag(id: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.deleteApiAdminTags(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to delete tag:', error);
    return parseErrorResponse(error, 'タグの削除に失敗しました');
  }
}

/**
 * Server Action: タグを有効化
 */
export async function activateTag(id: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.patchApiAdminTagsActivate(id);
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
        latest: {
          type: 'tag',
          data: current as TagDetailResponse,
        },
      };
    }
    console.error('Failed to activate tag:', error);
    return parseErrorResponse(error, 'タグの有効化に失敗しました');
  }
}

/**
 * Server Action: タグを無効化
 */
export async function deactivateTag(id: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminTag.patchApiAdminTagsDeactivate(id);
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
        latest: {
          type: 'tag',
          data: current as TagDetailResponse,
        },
      };
    }
    console.error('Failed to deactivate tag:', error);

    return parseErrorResponse(error, 'タグの無効化に失敗しました');
  }
}
