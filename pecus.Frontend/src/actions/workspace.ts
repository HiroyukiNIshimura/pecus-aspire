'use server';

import {
  createPecusApiClients,
  detect400ValidationError,
  detect404ValidationError,
  detectConcurrencyError,
  parseErrorResponse,
} from '@/connectors/api/PecusApiClient';
import type { WorkspaceFullDetailResponse } from '@/connectors/api/pecus';
import type { ApiResponse } from './types';

/**
 * Server Action: ワークスペースを作成（一般ユーザー用）
 */
export async function createWorkspace(request: {
  name: string;
  code?: string;
  description?: string;
  genreId: number;
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
        latest: { type: 'workspace', data: concurrency.payload.current as WorkspaceFullDetailResponse },
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
      return {
        success: false,
        error: 'validation',
        message: 'ワークスペースのバージョン情報が取得できませんでした。',
      };
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
        latest: { type: 'workspace', data: concurrency.payload.current as WorkspaceFullDetailResponse },
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
