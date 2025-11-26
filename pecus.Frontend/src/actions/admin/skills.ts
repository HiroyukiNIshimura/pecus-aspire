'use server';

import { createPecusApiClients, detectConcurrencyError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  SkillDetailResponse,
  SkillListItemResponse,
  SkillListItemResponseSkillStatisticsPagedResponse,
  SkillResponse,
  SuccessResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from '../types';

/**
 * Server Action: スキル一覧を取得（ページネーション対応）
 */
export async function getSkills(
  page: number = 1,
  isActive: boolean = true,
): Promise<ApiResponse<SkillListItemResponseSkillStatisticsPagedResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.getApiAdminSkills(page, isActive);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    return parseErrorResponse(error, 'スキル一覧の取得に失敗しました');
  }
}

/**
 * Server Action: 全スキルを取得（フィルター用）
 * 複数ページを自動取得して結合
 */
export async function getAllSkills(isActive: boolean = true): Promise<ApiResponse<SkillListItemResponse[]>> {
  try {
    const api = createPecusApiClients();
    const allSkills: SkillListItemResponse[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await api.adminSkill.getApiAdminSkills(currentPage, isActive);

      if (response.data && response.data.length > 0) {
        allSkills.push(...response.data);

        // totalPagesから次ページの有無を判定
        if (response.totalPages && response.totalPages > 0) {
          hasMore = currentPage < response.totalPages;
          currentPage++;
        } else {
          // totalPagesがない場合は1ページのみと判断
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    return { success: true, data: allSkills };
  } catch (error) {
    console.error('Failed to fetch all skills:', error);
    return parseErrorResponse(error, '全スキルの取得に失敗しました');
  }
}

/**
 * Server Action: スキル情報を取得
 */
export async function getSkillDetail(id: number): Promise<ApiResponse<SkillDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.getApiAdminSkills1(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch skill detail:', error);
    return parseErrorResponse(error, 'スキル情報の取得に失敗しました');
  }
}

/**
 * Server Action: スキルを作成
 */
export async function createSkill(request: {
  name: string;
  description?: string;
}): Promise<ApiResponse<SkillResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.postApiAdminSkills(request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create skill:', error);
    return parseErrorResponse(error, 'スキルの作成に失敗しました');
  }
}

/**
 * Server Action: スキルを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateSkill(
  id: number,
  request: {
    name: string;
    description?: string;
    isActive?: boolean;
    rowVersion: number; // 楽観的ロック用（PostgreSQL xmin）
  },
): Promise<ApiResponse<SkillResponse | SkillDetailResponse>> {
  try {
    const api = createPecusApiClients();
    let response = await api.adminSkill.putApiAdminSkills(id, {
      name: request.name,
      description: request.description,
      rowVersion: request.rowVersion,
    });

    // isActive が指定されている場合、activate/deactivate を呼び出す
    if (request.isActive !== undefined) {
      if (request.isActive) {
        response = await api.adminSkill.patchApiAdminSkillsActivate(id);
      } else {
        response = await api.adminSkill.patchApiAdminSkillsDeactivate(id);
      }
    }

    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as SkillDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'skill',
          data: current as SkillDetailResponse,
        },
      };
    }

    console.error('Failed to update skill:', error);
    return parseErrorResponse(error, 'スキルの更新に失敗しました');
  }
}

/**
 * Server Action: スキルを削除
 */
export async function deleteSkill(id: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.deleteApiAdminSkills(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to delete skill:', error);

    return parseErrorResponse(error, 'スキルの削除に失敗しました');
  }
}

/**
 * Server Action: スキルを有効化
 */
export async function activateSkill(id: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.patchApiAdminSkillsActivate(id);
    return { success: true, data: response };
  } catch (error) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as SkillDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'skill',
          data: current as SkillDetailResponse,
        },
      };
    }
    console.error('Failed to activate skill:', error);
    return parseErrorResponse(error, 'スキルの有効化に失敗しました');
  }
}

/**
 * Server Action: スキルを無効化
 */
export async function deactivateSkill(id: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.patchApiAdminSkillsDeactivate(id);
    return { success: true, data: response };
  } catch (error) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as SkillDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'skill',
          data: current as SkillDetailResponse,
        },
      };
    }
    console.error('Failed to deactivate skill:', error);
    return parseErrorResponse(error, 'スキルの無効化に失敗しました');
  }
}
