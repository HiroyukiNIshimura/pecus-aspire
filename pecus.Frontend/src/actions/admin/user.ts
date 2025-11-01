'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { ApiResponse } from '../types';

/**
 * Server Action: ユーザー一覧を取得
 */
export async function getUsers(
  page: number = 1,
  pageSize?: number,
  isActive?: boolean,
  username?: string,
  skillIds?: number[]
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.getApiAdminUsers(page, pageSize, isActive, username, skillIds);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'Failed to fetch users'
    };
  }
}

/**
 * Server Action: パスワードなしでユーザーを作成（招待）
 */
export async function createUserWithoutPassword(request: {
  email: string;
  username: string;
  roleIds: number[];
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.postApiAdminUsersCreateWithoutPassword(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to create user:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'Failed to create user'
    };
  }
}

/**
 * Server Action: ユーザーを削除
 */
export async function deleteUser(userId: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.deleteApiAdminUsers(userId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to delete user:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'Failed to delete user'
    };
  }
}

/**
 * Server Action: ユーザーのアクティブ状態を設定
 */
export async function setUserActiveStatus(
  userId: number,
  isActive: boolean
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.putApiAdminUsersActiveStatus(userId, { isActive });
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to set user active status:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'Failed to set user active status'
    };
  }
}

/**
 * Server Action: パスワードリセットをリクエスト
 */
export async function requestPasswordReset(userId: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.postApiAdminUsersRequestPasswordReset(userId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Failed to request password reset:', error);
    return {
      success: false,
      error: error.body?.message || error.message || 'Failed to request password reset'
    };
  }
}

