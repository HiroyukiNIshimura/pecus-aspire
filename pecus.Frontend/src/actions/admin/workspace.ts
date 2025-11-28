'use server';

import { createPecusApiClients, detectConcurrencyError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  SuccessResponse,
  WorkspaceDetailResponse,
  WorkspaceListItemResponseWorkspaceStatisticsPagedResponse,
  WorkspaceUserDetailResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from '../types';

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
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return parseErrorResponse(error, 'ワークスペース一覧の取得に失敗しました');
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
  } catch (error) {
    console.error('Failed to fetch workspace detail:', error);
    return parseErrorResponse(error, 'ワークスペース詳細の取得に失敗しました');
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
}): Promise<ApiResponse<WorkspaceDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.postApiAdminWorkspaces(request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create workspace:', error);
    return parseErrorResponse(error, 'ワークスペースの作成に失敗しました');
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
): Promise<ApiResponse<WorkspaceDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.putApiAdminWorkspaces(workspaceId, request);
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'workspace',
          data: current as WorkspaceDetailResponse,
        },
      };
    }

    console.error('Failed to update workspace:', error);
    return parseErrorResponse(error, 'ワークスペースの更新に失敗しました');
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
  } catch (error) {
    console.error('Failed to delete workspace:', error);
    return parseErrorResponse(error, 'ワークスペースの削除に失敗しました');
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
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'workspace',
          data: current as WorkspaceDetailResponse,
        },
      };
    }

    console.error('Failed to activate workspace:', error);
    return parseErrorResponse(error, 'ワークスペースの有効化に失敗しました');
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
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as WorkspaceDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'workspace',
          data: current as WorkspaceDetailResponse,
        },
      };
    }

    console.error('Failed to deactivate workspace:', error);
    return parseErrorResponse(error, 'ワークスペースの無効化に失敗しました');
  }
}

/**
 * Server Action: ワークスペースからメンバーを削除
 */
export async function removeWorkspaceMember(
  workspaceId: number,
  userId: number,
): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.deleteApiAdminWorkspacesUsers(workspaceId, userId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to remove workspace member:', error);
    return parseErrorResponse(error, 'メンバーの削除に失敗しました');
  }
}

/**
 * Server Action: ワークスペースメンバーのロールを変更
 */
export async function updateWorkspaceMemberRole(
  workspaceId: number,
  userId: number,
  workspaceRole: 'Owner' | 'Member' | 'Viewer',
): Promise<ApiResponse<WorkspaceUserDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.patchApiAdminWorkspacesUsersRole(workspaceId, userId, {
      workspaceRole,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update workspace member role:', error);
    return parseErrorResponse(error, 'ロールの変更に失敗しました');
  }
}

/**
 * Server Action: ワークスペースにメンバーを追加
 */
export async function addWorkspaceMember(
  workspaceId: number,
  userId: number,
  workspaceRole: 'Owner' | 'Member' | 'Viewer',
): Promise<ApiResponse<WorkspaceUserDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminWorkspace.postApiAdminWorkspacesUsers(workspaceId, {
      userId,
      workspaceRole,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to add workspace member:', error);
    return parseErrorResponse(error, 'メンバーの追加に失敗しました');
  }
}
