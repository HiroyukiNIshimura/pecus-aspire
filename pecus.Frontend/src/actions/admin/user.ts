'use server';

import { createPecusApiClients, detectConcurrencyError } from '@/connectors/api/PecusApiClient';
import type {
  PagedResponseOfUserDetailResponseAndUserStatistics,
  RoleListItemResponse,
  SuccessResponse,
  UserDetailResponse,
  UserSearchResultResponse,
  UsersWorkloadResponse,
} from '@/connectors/api/pecus';
import {
  type CreateUserWithoutPasswordInput,
  createUserWithoutPasswordInputSchema,
  type GetUserDetailInput,
  type GetUsersInput,
  type GetUsersWorkloadInput,
  getUserDetailInputSchema,
  getUsersInputSchema,
  getUsersWorkloadInputSchema,
  type RequestPasswordResetInput,
  type ResendPasswordSetupInput,
  requestPasswordResetInputSchema,
  resendPasswordSetupInputSchema,
  type SearchUsersForWorkspaceInput,
  searchUsersForWorkspaceInputSchema,
  type UpdateUserInput,
  updateUserInputSchema,
} from '@/schemas/adminUserSchemas';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';
import { validationError } from '../types';

/**
 * Server Action: ユーザー一覧を取得
 */
export async function getUsers(
  input: GetUsersInput = {},
): Promise<ApiResponse<PagedResponseOfUserDetailResponseAndUserStatistics>> {
  const parseResult = getUsersInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.getApiAdminUsers1(
      parseResult.data.page ?? 1,
      parseResult.data.isActive,
      parseResult.data.username,
      parseResult.data.skillIds,
      parseResult.data.skillFilterMode ?? 'and',
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザー一覧の取得に失敗しました' });
  }
}

/**
 * Server Action: パスワードなしでユーザーを作成（招待）
 */
export async function createUserWithoutPassword(
  input: CreateUserWithoutPasswordInput,
): Promise<ApiResponse<UserDetailResponse>> {
  const parseResult = createUserWithoutPasswordInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.postApiAdminUsersCreateWithoutPassword(parseResult.data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create user:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザーの作成に失敗しました' });
  }
}

/**
 * Server Action: ユーザー情報を一括更新（管理者用）
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateUser(input: UpdateUserInput): Promise<ApiResponse<UserDetailResponse>> {
  const parseResult = updateUserInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.putApiAdminUsers(parseResult.data.userId, parseResult.data.request);
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
        latest: current
          ? {
              type: 'user',
              data: current,
            }
          : undefined,
      };
    }
    console.error('Failed to update user:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザー情報の更新に失敗しました' });
  }
}

/**
 * Server Action: パスワードリセットをリクエスト
 */
export async function requestPasswordReset(input: RequestPasswordResetInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = requestPasswordResetInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.postApiAdminUsersRequestPasswordReset(parseResult.data.userId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to request password reset:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'パスワードリセットのリクエストに失敗しました' });
  }
}

/**
 * Server Action: パスワード設定メールを再送（新規ユーザー用）
 */
export async function resendPasswordSetup(input: ResendPasswordSetupInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = resendPasswordSetupInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.postApiAdminUsersResendPasswordSetup(parseResult.data.userId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to resend password setup email:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'パスワード設定メールの再送に失敗しました' });
  }
}

/**
 * Server Action: ユーザー情報を取得
 */
export async function getUserDetail(input: GetUserDetailInput): Promise<ApiResponse<UserDetailResponse>> {
  const parseResult = getUserDetailInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.getApiAdminUsers(parseResult.data.userId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch user detail:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザー情報の取得に失敗しました' });
  }
}

/**
 * Server Action: ワークスペースメンバー追加用のユーザー検索
 * pgroonga を使用したあいまい検索で、日本語の漢字のゆらぎやタイポにも対応
 */
export async function searchUsersForWorkspace(
  input: SearchUsersForWorkspaceInput,
): Promise<ApiResponse<UserSearchResultResponse[]>> {
  const parseResult = searchUsersForWorkspaceInputSchema.safeParse(input);
  if (!parseResult.success) {
    const hasTooShortQuery = parseResult.error.issues.some(
      (issue) => issue.path[0] === 'query' && issue.code === 'too_small',
    );
    if (hasTooShortQuery) {
      return { success: true, data: [] };
    }

    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.user.getApiUsersSearch(parseResult.data.query, parseResult.data.limit ?? 20);
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

/**
 * Server Action: 複数ユーザーの負荷情報を一括取得
 * メンバーリスト表示時など、複数ユーザーの負荷を効率的に取得
 * @param userIds ユーザーIDの配列（最大50件）
 */
export async function getUsersWorkload(input: GetUsersWorkloadInput): Promise<ApiResponse<UsersWorkloadResponse>> {
  const parseResult = getUsersWorkloadInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    if (!parseResult.data.userIds || parseResult.data.userIds.length === 0) {
      return { success: true, data: { workloads: {} } };
    }

    const api = createPecusApiClients();
    const response = await api.user.postApiUsersWorkload({ userIds: parseResult.data.userIds });
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch users workload:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザーの負荷情報の取得に失敗しました' });
  }
}
