'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  PagedResponseOfUserDetailResponseAndUserStatistics,
  RoleListItemResponse,
  SuccessResponse,
  UserDetailResponse,
  UserSearchResultResponse,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';

/**
 * Server Action: ユーザー一覧を取得
 */
export async function getUsers(
  page: number = 1,
  isActive?: boolean,
  username?: string,
  skillIds?: number[],
  skillFilterMode: string = 'and',
): Promise<ApiResponse<PagedResponseOfUserDetailResponseAndUserStatistics>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.getApiAdminUsers1(page, isActive, username, skillIds, skillFilterMode);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザー一覧の取得に失敗しました' });
  }
}

/**
 * Server Action: パスワードなしでユーザーを作成（招待）
 */
export async function createUserWithoutPassword(request: {
  email: string;
  username: string;
  roles: number[];
}): Promise<ApiResponse<UserDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.postApiAdminUsersCreateWithoutPassword(request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create user:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザーの作成に失敗しました' });
  }
}

/**
 * Server Action: ユーザーのアクティブ状態を設定
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function setUserActiveStatus(userId: number, isActive: boolean): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.putApiAdminUsersActiveStatus(userId, {
      isActive,
    });
    return { success: true, data: response };
  } catch (error) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as UserDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'user',
          data: current as UserDetailResponse,
        },
      };
    }
    console.error('Failed to set user active status:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザーのアクティブ状態の設定に失敗しました' });
  }
}

/**
 * Server Action: パスワードリセットをリクエスト
 */
export async function requestPasswordReset(userId: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.postApiAdminUsersRequestPasswordReset(userId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to request password reset:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'パスワードリセットのリクエストに失敗しました' });
  }
}

/**
 * Server Action: パスワード設定メールを再送（新規ユーザー用）
 */
export async function resendPasswordSetup(userId: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.postApiAdminUsersResendPasswordSetup(userId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to resend password setup email:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'パスワード設定メールの再送に失敗しました' });
  }
}

/**
 * Server Action: ユーザー情報を取得
 */
export async function getUserDetail(userId: number): Promise<ApiResponse<UserDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.getApiAdminUsers(userId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch user detail:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザー情報の取得に失敗しました' });
  }
}

/**
 * Server Action: ユーザーのスキルを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function setUserSkills(
  userId: number,
  skillIds: number[],
  userRowVersion: number,
): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.putApiAdminUsersSkills(userId, {
      skillIds,
      userRowVersion,
    });
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as UserDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'user',
          data: current as UserDetailResponse,
        },
      };
    }

    console.error('Failed to set user skills:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザースキルの更新に失敗しました' });
  }
}

/**
 * Server Action: ユーザーのロールを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 *
 * Note: userRowVersion は楽観的ロック用で、バックエンド側で検証されます。
 * 現在のバックエンドで UserResponse に rowVersion が含まれていないため、
 * オプション扱いですが、将来的には必須化予定です。
 */
export async function setUserRoles(
  userId: number,
  roleIds: number[],
  userRowVersion: number,
): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.putApiAdminUsersRoles(userId, {
      roles: roleIds,
      userRowVersion,
    });
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as UserDetailResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'user',
          data: current as UserDetailResponse,
        },
      };
    }

    console.error('Failed to set user roles:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザーロールの更新に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースメンバー追加用のユーザー検索
 * pgroonga を使用したあいまい検索で、日本語の漢字のゆらぎやタイポにも対応
 */
export async function searchUsersForWorkspace(
  query: string,
  limit: number = 20,
): Promise<ApiResponse<UserSearchResultResponse[]>> {
  try {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }

    const api = createPecusApiClients();
    const response = await api.user.getApiUsersSearch(query, limit);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to search users:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザー検索に失敗しました' });
  }
}

/**
 * Server Action: 全ロール一覧を取得
 */
export async function getRoles(): Promise<ApiResponse<RoleListItemResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.getApiAdminUsersRoles();
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ロール一覧の取得に失敗しました' });
  }
}
