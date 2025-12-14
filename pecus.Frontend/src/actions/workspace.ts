'use server';

import {
  createPecusApiClients,
  detect400ValidationError,
  detect404ValidationError,
  detectConcurrencyError,
  parseErrorResponse,
} from '@/connectors/api/PecusApiClient';
import type {
  SuccessResponse,
  WorkspaceDetailResponse,
  WorkspaceFullDetailResponse,
  WorkspaceListItemResponse,
  WorkspaceMode,
  WorkspaceRole,
  WorkspaceUserDetailResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from './types';
import { validationError } from './types';

/**
 * Server Action: ワークスペースリストを全件取得（一般ユーザー用）
 * WorkspaceSwitcher などワークスペース切り替え用で使用
 * ページネーションで全件取得する
 * @deprecated getMyWorkspacesPaged を使用してください
 */
export async function getMyWorkspaces(): Promise<ApiResponse<WorkspaceListItemResponse[]>> {
  try {
    const api = createPecusApiClients();
    const allWorkspaces: WorkspaceListItemResponse[] = [];
    let page = 1;
    let hasMore = true;

    // 全ページを取得
    while (hasMore) {
      const response = await api.workspace.getApiWorkspaces(page, true, undefined, undefined);

      if (response.data && response.data.length > 0) {
        allWorkspaces.push(...response.data);
        page++;
        hasMore = page <= (response.totalPages || 1);
      } else {
        hasMore = false;
      }
    }

    return { success: true, data: allWorkspaces };
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return parseErrorResponse(error, 'ワークスペースリストの取得に失敗しました。');
  }
}

/**
 * ページネーション付きワークスペースリストレスポンス
 */
export interface PagedWorkspacesResponse {
  data: WorkspaceListItemResponse[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

/**
 * Server Action: ワークスペースリストをページネーションで取得（一般ユーザー用）
 * WorkspaceSwitcher の無限スクロールで使用
 *
 * @param page ページ番号（1始まり）
 */
export async function getMyWorkspacesPaged(page: number = 1): Promise<ApiResponse<PagedWorkspacesResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.getApiWorkspaces(page, true, undefined, undefined);

    return {
      success: true,
      data: {
        data: response.data || [],
        currentPage: response.currentPage || page,
        totalPages: response.totalPages || 1,
        totalCount: response.totalCount || 0,
        hasMore: (response.currentPage || page) < (response.totalPages || 1),
      },
    };
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return parseErrorResponse(error, 'ワークスペースリストの取得に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースを作成（一般ユーザー用）
 */
export async function createWorkspace(request: {
  name: string;
  code?: string;
  description?: string;
  genreId: number;
  mode?: WorkspaceMode;
}): Promise<ApiResponse<WorkspaceFullDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.postApiWorkspaces(request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create workspace:', error);

    const badRequest = detect400ValidationError(error);
    // バリデーションエラー
    if (badRequest) {
      return badRequest;
    }

    return parseErrorResponse(error, 'ワークスペースの作成に失敗しました。');
  }
}

/**
 * Server Action: ワークスペース詳細を取得
 */
export async function getWorkspaceDetail(workspaceId: number): Promise<ApiResponse<WorkspaceFullDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.getApiWorkspaces1(workspaceId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to get workspace detail:', error);

    const notFound = detect404ValidationError(error);
    // 存在しない（404 Not Found）
    if (notFound) {
      return notFound;
    }

    // その他のエラー
    return parseErrorResponse(error, 'ワークスペースの取得に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースを更新
 */
export async function updateWorkspace(
  workspaceId: number,
  request: {
    name: string;
    description?: string;
    genreId: number;
    rowVersion: number;
  },
): Promise<ApiResponse<WorkspaceFullDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.putApiWorkspaces(workspaceId, {
      name: request.name,
      description: request.description,
      genreId: request.genreId,
      rowVersion: request.rowVersion,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update workspace:', error);

    // 競合エラー（409 Conflict）
    const concurrency = detectConcurrencyError(error);
    if (concurrency) {
      return {
        success: false,
        error: 'conflict',
        message: concurrency.message || '別のユーザーが同時に更新しました。',
        latest: { type: 'workspace', data: concurrency.payload.current as WorkspaceDetailResponse },
      };
    }

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      // バリデーションエラー
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }
    // その他のエラー
    return parseErrorResponse(error, 'ワークスペースの更新に失敗しました。');
  }
}

/**
 * Server Action: ワークスペースの有効/無効を切り替え
 */
export async function toggleWorkspaceActive(
  workspaceId: number,
  isActive: boolean,
): Promise<ApiResponse<WorkspaceFullDetailResponse>> {
  try {
    const api = createPecusApiClients();

    // 最新のワークスペース情報を取得してrowVersionを取得
    const detailResponse = await api.workspace.getApiWorkspaces1(workspaceId);

    console.log('Toggle workspace:', {
      workspaceId,
      isActive,
      rowVersion: detailResponse.rowVersion,
      rowVersionType: typeof detailResponse.rowVersion,
      currentIsActive: detailResponse.isActive,
    });

    // rowVersionが存在しない、または0の場合はエラー
    if (!detailResponse.rowVersion || detailResponse.rowVersion === 0) {
      console.error('Invalid rowVersion:', detailResponse.rowVersion);
      return validationError('ワークスペースのバージョン情報が取得できませんでした。');
    }

    // isActiveに応じて適切なエンドポイントを呼び出す
    const response = isActive
      ? await api.workspace.postApiWorkspacesActivate(workspaceId, detailResponse.rowVersion)
      : await api.workspace.postApiWorkspacesDeactivate(workspaceId, detailResponse.rowVersion);

    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to toggle workspace active status:', error);

    // 競合エラー（409 Conflict）
    const concurrency = detectConcurrencyError(error);
    if (concurrency) {
      return {
        success: false,
        error: 'conflict',
        message: concurrency.message || '別のユーザーが同時に更新しました。',
        latest: { type: 'workspace', data: concurrency.payload.current as WorkspaceDetailResponse },
      };
    }

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      // バリデーションエラー
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      // 存在しない（404 Not Found）
      return notFound;
    }

    return parseErrorResponse(error, 'ワークスペースの状態変更に失敗しました。');
  }
}

// ===== メンバー管理（一般ユーザー用 - Owner権限が必要） =====

/**
 * Server Action: ワークスペースにメンバーを追加（Owner権限が必要）
 */
export async function addMemberToWorkspace(
  workspaceId: number,
  userId: number,
  workspaceRole: WorkspaceRole,
): Promise<ApiResponse<WorkspaceUserDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.postApiWorkspacesMembers(workspaceId, {
      userId,
      workspaceRole,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to add member to workspace:', error);

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'メンバーの追加に失敗しました');
  }
}

/**
 * Server Action: ワークスペースからメンバーを削除（Owner権限または自分自身）
 */
export async function removeMemberFromWorkspace(workspaceId: number, userId: number): Promise<ApiResponse<void>> {
  try {
    const api = createPecusApiClients();
    await api.workspace.deleteApiWorkspacesMembers(workspaceId, userId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to remove member from workspace:', error);

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'メンバーの削除に失敗しました');
  }
}

/**
 * Server Action: ワークスペースメンバーのロールを変更（Owner権限が必要）
 */
export async function updateMemberRoleInWorkspace(
  workspaceId: number,
  userId: number,
  newRole: WorkspaceRole,
): Promise<ApiResponse<WorkspaceUserDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.patchApiWorkspacesMembersRole(workspaceId, userId, {
      workspaceRole: newRole,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update member role:', error);

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'ロールの変更に失敗しました');
  }
}

/**
 * Server Action: ワークスペースのスキルを設定（Owner権限が必要）
 * 既存のスキルを洗い替えします（指定されたスキル以外は削除されます）
 */
export async function setWorkspaceSkills(
  workspaceId: number,
  skillIds: number[],
  rowVersion: number,
): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.putApiWorkspacesSkills(workspaceId, {
      skillIds,
      rowVersion,
    });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to set workspace skills:', error);

    // 競合エラー（409 Conflict）
    const concurrency = detectConcurrencyError(error);
    if (concurrency) {
      return {
        success: false,
        error: 'conflict',
        message: concurrency.message || '別のユーザーが同時に更新しました。ページを再読み込みしてください。',
        latest: { type: 'workspace', data: concurrency.payload.current as WorkspaceDetailResponse },
      };
    }

    const badRequest = detect400ValidationError(error);
    if (badRequest) {
      return badRequest;
    }

    const notFound = detect404ValidationError(error);
    if (notFound) {
      return notFound;
    }

    return parseErrorResponse(error, 'スキルの設定に失敗しました');
  }
}
