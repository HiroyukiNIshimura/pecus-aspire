"use server";

import { createPecusApiClients, detectConcurrencyError } from "@/connectors/api/PecusApiClient";
import type {
  SuccessResponse,
  WorkspaceDetailResponse,
  WorkspaceListItemResponseWorkspaceStatisticsPagedResponse,
  WorkspaceResponse,
} from "@/connectors/api/pecus";
import type { ApiResponse } from "../types";

/**
 * Server Action: ワークスペース一覧を取得
 */
export async function getWorkspaces(
  page: number = 1,
  isActive?: boolean,
  genreId?: number,
): Promise<ApiResponse<WorkspaceListItemResponseWorkspaceStatisticsPagedResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.getApiAdminWorkspaces(page, isActive, genreId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch workspaces:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to fetch workspaces",
    };
  }
}

/**
 * Server Action: ワークスペース詳細を取得
 */
export async function getWorkspaceDetail(workspaceId: number): Promise<ApiResponse<WorkspaceDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.getApiAdminWorkspaces1(workspaceId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch workspace detail:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to fetch workspace detail",
    };
  }
}

/**
 * Server Action: ワークスペースを作成
 */
export async function createWorkspace(request: {
  organizationId: number;
  name: string;
  description?: string;
  genreId: number;
}): Promise<ApiResponse<WorkspaceResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.postApiAdminWorkspaces(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to create workspace:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to create workspace",
    };
  }
}

/**
 * Server Action: ワークスペースを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateWorkspace(
  workspaceId: number,
  request: {
    name: string;
    description?: string;
    genreId: number;
    rowVersion: number; // 楽観的ロック用（PostgreSQL xmin）
  },
): Promise<ApiResponse<WorkspaceResponse | WorkspaceDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.putApiAdminWorkspaces(workspaceId, request);
    return { success: true, data: response };
  } catch (error: any) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "workspace",
          data: current as WorkspaceDetailResponse,
        },
      };
    }

    console.error("Failed to update workspace:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to update workspace",
    };
  }
}

/**
 * Server Action: ワークスペースを削除
 */
export async function deleteWorkspace(workspaceId: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.deleteApiAdminWorkspaces(workspaceId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to delete workspace:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to delete workspace",
    };
  }
}

/**
 * Server Action: ワークスペースを有効化
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function activateWorkspace(workspaceId: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.patchApiAdminWorkspacesActivate(workspaceId);
    return { success: true, data: response };
  } catch (error: any) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "workspace",
          data: current as WorkspaceDetailResponse,
        },
      };
    }

    console.error("Failed to activate workspace:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to activate workspace",
    };
  }
}

/**
 * Server Action: ワークスペースを無効化
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function deactivateWorkspace(workspaceId: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.patchApiAdminWorkspacesDeactivate(workspaceId);
    return { success: true, data: response };
  } catch (error: any) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "workspace",
          data: current as WorkspaceDetailResponse,
        },
      };
    }

    console.error("Failed to deactivate workspace:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to deactivate workspace",
    };
  }
}
