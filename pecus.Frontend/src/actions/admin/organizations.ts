'use server';

import { createPecusApiClients, detectConcurrencyError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  AdminUpdateOrganizationSettingRequest,
  OrganizationResponse,
  OrganizationSettingResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from '../types';

/**
 * Server Action: 自組織の詳細情報を取得
 */
export async function getOrganizationDetail(): Promise<ApiResponse<OrganizationResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminOrganization.getApiAdminOrganization();
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch organization detail:', error);
    return parseErrorResponse(error, '組織情報の取得に失敗しました');
  }
}

/**
 * Server Action: 自組織の情報を更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateOrganization(request: {
  name?: string;
  code?: string;
  description?: string;
  representativeName?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
  rowVersion: number; // 楽観的ロック用（PostgreSQL xmin）
}): Promise<ApiResponse<OrganizationResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminOrganization.putApiAdminOrganization(request);
    return { success: true, data: response };
  } catch (error) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = payload.current as OrganizationResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: {
          type: 'organization',
          data: current as OrganizationResponse,
        },
      };
    }

    console.error('Failed to update organization:', error);
    return parseErrorResponse(error, '組織情報の更新に失敗しました');
  }
}

/**
 * Server Action: 自組織の設定を更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateOrganizationSetting(request: {
  taskOverdueThreshold?: number;
  weeklyReportDeliveryDay?: number;
  mailFromAddress?: string | null;
  mailFromName?: string | null;
  generativeApiVendor: OrganizationSettingResponse['generativeApiVendor'];
  plan: OrganizationSettingResponse['plan'];
  helpNotificationTarget?: OrganizationSettingResponse['helpNotificationTarget'];
  generativeApiKey?: string | null;
  rowVersion: number;
}): Promise<ApiResponse<OrganizationSettingResponse>> {
  try {
    const api = createPecusApiClients();
    const payload: AdminUpdateOrganizationSettingRequest & { generativeApiKey?: string | null } = {
      ...request,
    };

    const response = await api.adminOrganization.putApiAdminOrganizationSetting(payload);
    return { success: true, data: response };
  } catch (error) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      const payload = concurrencyError.payload ?? {};
      const current = (payload as Record<string, unknown>).current as OrganizationSettingResponse | undefined;
      return {
        success: false,
        error: 'conflict',
        message: concurrencyError.message,
        latest: current
          ? {
              type: 'organizationSetting',
              data: current,
            }
          : undefined,
      } as ApiResponse<OrganizationSettingResponse>;
    }

    console.error('Failed to update organization setting:', error);
    return parseErrorResponse(error, '組織設定の更新に失敗しました');
  }
}

/**
 * Server Action: 組織情報を取得（getOrganizationDetail() のエイリアス）
 * 互換性のための別名関数
 */
export async function getOrganization(): Promise<ApiResponse<OrganizationResponse>> {
  return getOrganizationDetail();
}
