'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  BackOfficeBotResponse,
  BackOfficeOrganizationDetailResponse,
  OrganizationWithAdminResponse,
  PagedResponseOfBackOfficeOrganizationListItemResponse,
  SuccessResponse,
} from '@/connectors/api/pecus';
import {
  type CreateBackOfficeOrganizationInput,
  createBackOfficeOrganizationInputSchema,
  type DeleteBackOfficeOrganizationInput,
  deleteBackOfficeOrganizationInputSchema,
  type GetBackOfficeOrganizationBotsInput,
  type GetBackOfficeOrganizationDetailInput,
  type GetBackOfficeOrganizationsInput,
  getBackOfficeOrganizationBotsInputSchema,
  getBackOfficeOrganizationDetailInputSchema,
  getBackOfficeOrganizationsInputSchema,
  type ResendOrganizationCreatedEmailInput,
  resendOrganizationCreatedEmailInputSchema,
  type UpdateBackOfficeBotPersonaInput,
  type UpdateBackOfficeOrganizationInput,
  updateBackOfficeBotPersonaInputSchema,
  updateBackOfficeOrganizationInputSchema,
} from '@/schemas/backofficeOrganizationSchemas';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';
import { validationError } from '../types';

/**
 * Server Action: BackOffice - 組織一覧を取得（ページネーション付き）
 */
export async function getBackOfficeOrganizations(
  input: GetBackOfficeOrganizationsInput = {},
): Promise<ApiResponse<PagedResponseOfBackOfficeOrganizationListItemResponse>> {
  const parseResult = getBackOfficeOrganizationsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.getApiBackofficeOrganizations(
      parseResult.data.page,
      parseResult.data.pageSize,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch backoffice organizations:', error);
    return handleApiErrorForAction(error, { defaultMessage: '組織一覧の取得に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - 組織詳細を取得
 */
export async function getBackOfficeOrganizationDetail(
  input: GetBackOfficeOrganizationDetailInput,
): Promise<ApiResponse<BackOfficeOrganizationDetailResponse>> {
  const parseResult = getBackOfficeOrganizationDetailInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.getApiBackofficeOrganizations1(parseResult.data.id);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch backoffice organization detail:', error);
    return handleApiErrorForAction(error, { defaultMessage: '組織詳細の取得に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - 組織を更新
 */
export async function updateBackOfficeOrganization(
  input: UpdateBackOfficeOrganizationInput,
): Promise<ApiResponse<BackOfficeOrganizationDetailResponse>> {
  const parseResult = updateBackOfficeOrganizationInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.putApiBackofficeOrganizations(
      parseResult.data.id,
      parseResult.data.request,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update backoffice organization:', error);
    return handleApiErrorForAction(error, { defaultMessage: '組織の更新に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - 組織を削除（物理削除）
 * 確認用に組織コードの入力が必要
 */
export async function deleteBackOfficeOrganization(
  input: DeleteBackOfficeOrganizationInput,
): Promise<ApiResponse<void>> {
  const parseResult = deleteBackOfficeOrganizationInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    await api.backOfficeOrganizations.deleteApiBackofficeOrganizations(parseResult.data.id, {
      confirmOrganizationCode: parseResult.data.confirmOrganizationCode,
      rowVersion: parseResult.data.rowVersion,
    });
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete backoffice organization:', error);
    return handleApiErrorForAction(error, { defaultMessage: '組織の削除に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - 組織を新規作成（管理者ユーザーも同時作成）
 */
export async function createBackOfficeOrganization(
  input: CreateBackOfficeOrganizationInput,
): Promise<ApiResponse<OrganizationWithAdminResponse>> {
  const parseResult = createBackOfficeOrganizationInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.postApiBackofficeOrganizations(parseResult.data);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create backoffice organization:', error);
    return handleApiErrorForAction(error, { defaultMessage: '組織の作成に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - 組織登録完了メールを再送
 */
export async function resendOrganizationCreatedEmail(
  input: ResendOrganizationCreatedEmailInput,
): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = resendOrganizationCreatedEmailInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.postApiBackofficeOrganizationsResendCreatedEmail(
      parseResult.data.organizationId,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to resend organization created email:', error);
    return handleApiErrorForAction(error, { defaultMessage: '組織登録完了メールの再送に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - 組織のボット一覧を取得
 */
export async function getBackOfficeOrganizationBots(
  input: GetBackOfficeOrganizationBotsInput,
): Promise<ApiResponse<BackOfficeBotResponse[]>> {
  const parseResult = getBackOfficeOrganizationBotsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.getApiBackofficeOrganizationsBots(
      parseResult.data.organizationId,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch organization bots:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ボット一覧の取得に失敗しました' });
  }
}

/**
 * Server Action: BackOffice - ボットのPersona/Constraintを更新
 */
export async function updateBackOfficeBotPersona(
  input: UpdateBackOfficeBotPersonaInput,
): Promise<ApiResponse<BackOfficeBotResponse>> {
  const parseResult = updateBackOfficeBotPersonaInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.backOfficeOrganizations.putApiBackofficeOrganizationsBotsPersona(
      parseResult.data.organizationId,
      parseResult.data.botId,
      parseResult.data.request,
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to update bot persona:', error);
    return handleApiErrorForAction(error, { defaultMessage: 'ボットの更新に失敗しました' });
  }
}
