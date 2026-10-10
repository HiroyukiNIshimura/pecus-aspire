'use server';

import { getMasterRolesWithHeyApi } from '@/connectors/HeyApiClient';
import type { RoleResponse } from '@/connectors/hey-api-axios/types.gen';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';

/**
 * Server Action: ロール一覧を取得
 */
export async function getAllRoles(): Promise<ApiResponse<RoleResponse[]>> {
  try {
    const response = await getMasterRolesWithHeyApi();
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ロール一覧の取得に失敗しました' });
  }
}
