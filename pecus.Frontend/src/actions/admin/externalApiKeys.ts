'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  CreateExternalApiKeyRequest,
  CreateExternalApiKeyResponse,
  ExternalApiKeyResponse,
  SuccessResponse,
} from '@/connectors/api/pecus';
import {
  type CreateExternalApiKeyInput,
  createExternalApiKeyInputSchema,
  type RevokeExternalApiKeyInput,
  revokeExternalApiKeyInputSchema,
} from '@/schemas/externalApiKeySchemas';
import { handleApiErrorForAction } from '../apiErrorPolicy';
import type { ApiResponse } from '../types';
import { validationError } from '../types';

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
  input: CreateExternalApiKeyInput,
): Promise<ApiResponse<CreateExternalApiKeyResponse>> {
  const parseResult = createExternalApiKeyInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const request: CreateExternalApiKeyRequest = {
      name: parseResult.data.name,
      expirationDays: parseResult.data.expirationDays,
    };
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
export async function revokeExternalApiKey(input: RevokeExternalApiKeyInput): Promise<ApiResponse<SuccessResponse>> {
  const parseResult = revokeExternalApiKeyInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = createPecusApiClients();
    const response = await api.adminExternalApiKeys.deleteApiAdminExternalApiKeys(parseResult.data.keyId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to revoke external API key:', error);
    return handleApiErrorForAction(error, {
      defaultMessage: 'APIキーの失効に失敗しました。',
    });
  }
}
