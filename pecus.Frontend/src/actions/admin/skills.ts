"use server";

import { createPecusApiClients, detectConcurrencyError } from "@/connectors/api/PecusApiClient";
import { ApiResponse } from "../types";

/**
 * Server Action: スキル一覧を取得（ページネーション対応）
 */
export async function getSkills(
  page: number = 1,
  isActive: boolean = true,
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.getApiAdminSkills(page, isActive);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch skills:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "スキル一覧の取得に失敗しました",
    };
  }
}

/**
 * Server Action: 全スキルを取得（フィルター用）
 * 複数ページを自動取得して結合
 */
export async function getAllSkills(
  isActive: boolean = true,
): Promise<ApiResponse<any[]>> {
  try {
    const api = createPecusApiClients();
    const allSkills: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await api.adminSkill.getApiAdminSkills(
        currentPage,
        isActive,
      );

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
  } catch (error: any) {
    console.error("Failed to fetch all skills:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "全スキルの取得に失敗しました",
    };
  }
}

/**
 * Server Action: スキル情報を取得
 */
export async function getSkillDetail(id: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.getApiAdminSkills1(id);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch skill detail:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "スキル情報の取得に失敗しました",
    };
  }
}

/**
 * Server Action: スキルを作成
 */
export async function createSkill(request: {
  name: string;
  description?: string;
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.postApiAdminSkills(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to create skill:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "スキルの作成に失敗しました",
    };
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
    rowVersion: string; // 楽観的ロック用
  },
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.putApiAdminSkills(id, {
      name: request.name,
      description: request.description,
      rowVersion: request.rowVersion,
    });

    // isActive が指定されている場合、activate/deactivate を呼び出す
    if (request.isActive !== undefined) {
      if (request.isActive) {
        await api.adminSkill.patchApiAdminSkillsActivate(id);
      } else {
        await api.adminSkill.patchApiAdminSkillsDeactivate(id);
      }
    }

    return { success: true, data: response };
  } catch (error: any) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "skill",
          data: concurrencyError.payload as any,
        },
      };
    }

    console.error("Failed to update skill:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "スキルの更新に失敗しました",
    };
  }
}

/**
 * Server Action: スキルを削除
 */
export async function deleteSkill(id: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.deleteApiAdminSkills(id);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to delete skill:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "スキルの削除に失敗しました",
    };
  }
}

/**
 * Server Action: スキルを有効化
 */
export async function activateSkill(id: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.patchApiAdminSkillsActivate(id);
    return { success: true, data: response };
  } catch (error: any) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "skill",
          data: concurrencyError.payload as any,
        },
      };
    }
    console.error("Failed to activate skill:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "スキルの有効化に失敗しました",
    };
  }
}

/**
 * Server Action: スキルを無効化
 */
export async function deactivateSkill(id: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminSkill.patchApiAdminSkillsDeactivate(id);
    return { success: true, data: response };
  } catch (error: any) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "skill",
          data: concurrencyError.payload as any,
        },
      };
    }
    console.error("Failed to deactivate skill:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "スキルの無効化に失敗しました",
    };
  }
}
