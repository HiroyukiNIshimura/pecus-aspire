'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  PagedResponseOfSkillListItemResponseAndSkillStatistics,
  SkillDetailResponse,
  SkillListItemResponse,
  SkillResponse,
  SuccessResponse,
} from '@/connectors/api/pecus';
import {
  type ActivateSkillInput,
  activateSkillInputSchema,
  type CreateSkillInput,
  createSkillInputSchema,
  type DeactivateSkillInput,
  type DeleteSkillInput,
  deactivateSkillInputSchema,
  deleteSkillInputSchema,
  type GetAllSkillsInput,
  getAllSkillsInputSchema,
  type GetSkillDetailInput,
  getSkillDetailInputSchema,
  type GetSkillsInput,
  getSkillsInputSchema,
  type UpdateSkillInput,
  updateSkillInputSchema,
} from '@/schemas/adminSkillSchemas';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';
import { validationError } from '../types';

/**
 * Server Action: スキル一覧を取得（ページネーション対応）
 */
export async function getSkills(
  input: GetSkillsInput = {},
): Promise<ApiResponse<PagedResponseOfSkillListItemResponseAndSkillStatistics>> {
  const parseResult = getSkillsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.getApiAdminSkills(parseResult.data.page, parseResult.data.isActive);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'スキル一覧の取得に失敗しました' });
  }
}

/**
 * Server Action: 全スキルを取得（フィルター用）
 * 複数ページを自動取得して結合
 */
export async function getAllSkills(input: GetAllSkillsInput = {}): Promise<ApiResponse<SkillListItemResponse[]>> {
  const parseResult = getAllSkillsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }
  try {
    const api = createPecusApiClients();
    const allSkills: SkillListItemResponse[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await api.adminSkill.getApiAdminSkills(currentPage, parseResult.data.isActive);

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
    return handleApiErrorForAction(error, { defaultMessage: '全スキルの取得に失敗しました' });
  }
}

/**
 * Server Action: スキル情報を取得
 */
export async function getSkillDetail(input: GetSkillDetailInput): Promise<ApiResponse<SkillDetailResponse>> {
  const parseResult = getSkillDetailInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.getApiAdminSkills1(parseResult.data.id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch skill detail:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'スキル情報の取得に失敗しました' });
  }
}

/**
 * Server Action: スキルを作成
 */
export async function createSkill(input: CreateSkillInput): Promise<ApiResponse<SkillResponse>> {
  const parseResult = createSkillInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.postApiAdminSkills(parseResult.data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create skill:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'スキルの作成に失敗しました' });
  }
}

/**
 * Server Action: スキルを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateSkill(input: UpdateSkillInput): Promise<ApiResponse<SkillResponse | SkillDetailResponse>> {
  const parseResult = updateSkillInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    let response = await api.adminSkill.putApiAdminSkills(parseResult.data.id, {
      name: parseResult.data.name,
      description: parseResult.data.description,
      rowVersion: parseResult.data.rowVersion,
    });

    // isActive が指定されている場合、activate/deactivate を呼び出す
    if (parseResult.data.isActive !== undefined) {
      if (parseResult.data.isActive) {
        response = await api.adminSkill.patchApiAdminSkillsActivate(parseResult.data.id);
      } else {
        response = await api.adminSkill.patchApiAdminSkillsDeactivate(parseResult.data.id);
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
        latest: current
          ? {
              type: 'skill',
              data: current,
            }
          : undefined,
      };
    }

    console.error('Failed to update skill:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'スキルの更新に失敗しました' });
  }
}

/**
 * Server Action: スキルを削除
 */
export async function deleteSkill(input: DeleteSkillInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = deleteSkillInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.deleteApiAdminSkills(parseResult.data.id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to delete skill:', error);

    return handleApiErrorForAction(error, { defaultMessage: 'スキルの削除に失敗しました' });
  }
}

/**
 * Server Action: スキルを有効化
 */
export async function activateSkill(input: ActivateSkillInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = activateSkillInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.patchApiAdminSkillsActivate(parseResult.data.id);
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
        latest: current
          ? {
              type: 'skill',
              data: current,
            }
          : undefined,
      };
    }
    console.error('Failed to activate skill:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'スキルの有効化に失敗しました' });
  }
}

/**
 * Server Action: スキルを無効化
 */
export async function deactivateSkill(input: DeactivateSkillInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = deactivateSkillInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.patchApiAdminSkillsDeactivate(parseResult.data.id);
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
        latest: current
          ? {
              type: 'skill',
              data: current,
            }
          : undefined,
      };
    }
    console.error('Failed to deactivate skill:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'スキルの無効化に失敗しました' });
  }
}
