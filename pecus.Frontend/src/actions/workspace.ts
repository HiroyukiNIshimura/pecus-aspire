'use server';

import {
  createPecusApiClients,
  detectConcurrencyError,
  detectMemberHasAssignmentsError,
} from '@/connectors/api/PecusApiClient';
import type {
  DashboardTaskTrendResponse,
  PagedResponseOfWorkspaceListItemResponse,
  SuccessResponse,
  UserSearchResultResponse,
  WorkspaceDetailResponse,
  WorkspaceFullDetailResponse,
  WorkspaceListItemResponse,
  WorkspaceMode,
  WorkspaceRole,
  WorkspaceUserDetailResponse,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
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
      const response = await api.workspace.getApiWorkspaces(page, undefined, undefined);

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
    return handleApiErrorForAction<WorkspaceListItemResponse[]>(error, {
      defaultMessage: 'ワークスペースリストの取得に失敗しました。',
    });
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
    const response = await api.workspace.getApiWorkspaces(page, undefined, undefined);

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
    return handleApiErrorForAction<PagedWorkspacesResponse>(error, {
      defaultMessage: 'ワークスペースリストの取得に失敗しました。',
    });
  }
}

/**
 * Server Action: ワークスペース一覧を取得（フィルタ・ページネーション対応）
 * WorkspacesClient の一覧表示で使用
 *
 * @param page ページ番号（1始まり）
 * @param genreId ジャンルID（フィルタ用）
 * @param name ワークスペース名（フィルタ用）
 */
export async function fetchWorkspaces(
  page: number = 1,
  genreId?: number,
  name?: string,
): Promise<ApiResponse<PagedResponseOfWorkspaceListItemResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.getApiWorkspaces(page, genreId, name);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return handleApiErrorForAction<PagedResponseOfWorkspaceListItemResponse>(error, {
      defaultMessage: 'ワークスペース一覧の取得に失敗しました。',
    });
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

    return handleApiErrorForAction<WorkspaceFullDetailResponse>(error, {
      defaultMessage: 'ワークスペースの作成に失敗しました。',
      handled: { validation: true },
    });
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

    return handleApiErrorForAction<WorkspaceFullDetailResponse>(error, {
      defaultMessage: 'ワークスペースの取得に失敗しました。',
      handled: { not_found: true },
    });
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

    return handleApiErrorForAction<WorkspaceFullDetailResponse>(error, {
      defaultMessage: 'ワークスペースの更新に失敗しました。',
      handled: { validation: true, not_found: true },
    });
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

    return handleApiErrorForAction<WorkspaceFullDetailResponse>(error, {
      defaultMessage: 'ワークスペースの状態変更に失敗しました。',
      handled: { validation: true, not_found: true },
    });
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
    return handleApiErrorForAction<WorkspaceUserDetailResponse>(error, {
      defaultMessage: 'メンバーの追加に失敗しました',
      handled: { validation: true, not_found: true },
    });
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
    return handleApiErrorForAction<void>(error, {
      defaultMessage: 'メンバーの削除に失敗しました',
      handled: { validation: true, not_found: true },
    });
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

    // Viewerへの変更時にアサインメントがある場合（409 Conflict）
    const assignmentsError = detectMemberHasAssignmentsError(error);
    if (assignmentsError) {
      return {
        success: false,
        error: 'member_has_assignments',
        message: 'このメンバーには担当中のタスク/アイテムがあります。担当を外してからViewerに変更してください。',
        assignments: assignmentsError,
      };
    }

    return handleApiErrorForAction<WorkspaceUserDetailResponse>(error, {
      defaultMessage: 'ロールの変更に失敗しました',
      handled: { validation: true, not_found: true },
    });
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

    return handleApiErrorForAction<SuccessResponse>(error, {
      defaultMessage: 'スキルの設定に失敗しました',
      handled: { validation: true, not_found: true },
    });
  }
}

/**
 * Server Action: ワークスペースメンバーのあいまい検索
 * pgroonga を使用したあいまい検索で、日本語の漢字のゆらぎやタイポにも対応
 * タスクの担当者選択など、編集権限が必要な場面では excludeViewer=true を指定
 * @param workspaceId ワークスペースID
 * @param query 検索クエリ（2文字以上）
 * @param excludeViewer Viewerロールを除外するかどうか
 * @param limit 取得件数上限（デフォルト20）
 */
export async function searchWorkspaceMembers(
  workspaceId: number,
  query: string,
  excludeViewer: boolean = false,
  limit: number = 20,
): Promise<ApiResponse<UserSearchResultResponse[]>> {
  try {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const api = createPecusApiClients();
    const response = await api.workspace.getApiWorkspacesMembersSearch(workspaceId, query, limit, excludeViewer);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to search workspace members:', error);
    return handleApiErrorForAction<UserSearchResultResponse[]>(error, {
      defaultMessage: 'メンバー検索に失敗しました',
    });
  }
}

/**
 * Server Action: ワークスペースの週次タスクトレンドを取得
 * @param workspaceId ワークスペースID
 * @param weeks 取得する週数（4〜12、デフォルト8）
 */
export async function getWorkspaceTaskTrend(
  workspaceId: number,
  weeks: number = 8,
): Promise<ApiResponse<DashboardTaskTrendResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.getApiWorkspacesTaskTrend(workspaceId, weeks);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspace task trend:', error);
    return handleApiErrorForAction<DashboardTaskTrendResponse>(error, {
      defaultMessage: 'タスクトレンドの取得に失敗しました',
    });
  }
}
