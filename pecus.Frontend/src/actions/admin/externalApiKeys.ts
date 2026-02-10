'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  CreateExternalApiKeyRequest,
  CreateExternalApiKeyResponse,
  ExternalApiKeyResponse,
  SuccessResponse,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';

/**
 * 自組織のAPIキー一覧を取得
 */
export async function getExternalApiKeys(): Promise<ApiResponse<Array<ExternalApiKeyResponse>>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminExternalApiKeys.getApiAdminExternalApiKeys();
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch external API keys:', error);
    return handleApiErrorForAction(error, {
      defaultMessage: 'APIキーの取得に失敗しました。',
    });
  }
}

/**
 * APIキーを新規発行
 */
export async function createExternalApiKey(
  request: CreateExternalApiKeyRequest,
): Promise<ApiResponse<CreateExternalApiKeyResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminExternalApiKeys.postApiAdminExternalApiKeys(request);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to create external API key:', error);
    return handleApiErrorForAction(error, {
      defaultMessage: 'APIキーの発行に失敗しました。',
    });
  }
}

/**
 * APIキーを失効させる
 */
export async function revokeExternalApiKey(keyId: number): Promise<ApiResponse<SuccessResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminExternalApiKeys.deleteApiAdminExternalApiKeys(keyId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to revoke external API key:', error);
    return handleApiErrorForAction(error, {
      defaultMessage: 'APIキーの失効に失敗しました。',
    });
  }
}
