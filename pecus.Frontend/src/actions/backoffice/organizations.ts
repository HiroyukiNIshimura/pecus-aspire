'use server';

import { createPecusApiClients, detect400ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  BackOfficeOrganizationDetailResponse,
  BackOfficeUpdateOrganizationRequest,
  CreateOrganizationRequest,
  OrganizationWithAdminResponse,
  PagedResponseOfBackOfficeOrganizationListItemResponse,
} from '@/connectors/api/pecus';
import type { ApiResponse } from '../types';

/**
 * Server Action: BackOffice - 組織一覧を取得（ページネーション付き）
 */
export async function getBackOfficeOrganizations(
  page?: number,
  pageSize?: number,
): Promise<ApiResponse<PagedResponseOfBackOfficeOrganizationListItemResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.getApiBackofficeOrganizations(page, pageSize);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch backoffice organizations:', error);
    return parseErrorResponse(error, '組織一覧の取得に失敗しました');
  }
}

/**
 * Server Action: BackOffice - 組織詳細を取得
 */
export async function getBackOfficeOrganizationDetail(
  id: number,
): Promise<ApiResponse<BackOfficeOrganizationDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.getApiBackofficeOrganizations1(id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch backoffice organization detail:', error);
    return parseErrorResponse(error, '組織詳細の取得に失敗しました');
  }
}

/**
 * Server Action: BackOffice - 組織を更新
 */
export async function updateBackOfficeOrganization(
  id: number,
  request: BackOfficeUpdateOrganizationRequest,
): Promise<ApiResponse<BackOfficeOrganizationDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.putApiBackofficeOrganizations(id, request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update backoffice organization:', error);
    return parseErrorResponse(error, '組織の更新に失敗しました');
  }
}

/**
 * Server Action: BackOffice - 組織を削除（物理削除）
 * 確認用に組織コードの入力が必要
 */
export async function deleteBackOfficeOrganization(
  id: number,
  confirmOrganizationCode: string,
  rowVersion: number,
): Promise<ApiResponse<void>> {
  try {
    const api = createPecusApiClients();
    await api.backOfficeOrganizations.deleteApiBackofficeOrganizations(id, {
      confirmOrganizationCode,
      rowVersion,
    });
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete backoffice organization:', error);
    return parseErrorResponse(error, '組織の削除に失敗しました');
  }
}

/**
 * Server Action: BackOffice - 組織を新規作成（管理者ユーザーも同時作成）
 */
export async function createBackOfficeOrganization(
  request: CreateOrganizationRequest,
): Promise<ApiResponse<OrganizationWithAdminResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.postApiBackofficeOrganizations(request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create backoffice organization:', error);
    const validationError = detect400ValidationError(error);
    if (validationError) {
      return validationError;
    }
    return parseErrorResponse(error, '組織の作成に失敗しました');
  }
}
