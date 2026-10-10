'use server';

import { createPecusApiClients } from '@/connectors/legacy-api/PecusApiClient';
import type { RoleResponse } from '@/connectors/legacy-api/pecus';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';

/**
 * Server Action: ロール一覧を取得
 */
export async function getAllRoles(): Promise<ApiResponse<RoleResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.master.getApiMasterRoles();
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ロール一覧の取得に失敗しました' });
  }
}
