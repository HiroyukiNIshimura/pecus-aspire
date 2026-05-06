'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { ActivityPeriod, PagedResponseOfActivityResponse } from '@/connectors/api/pecus';
import {
  type FetchItemActivitiesInput,
  type FetchMyActivitiesInput,
  fetchItemActivitiesInputSchema,
  fetchMyActivitiesInputSchema,
} from '@/schemas/activitySchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

/**
 * アイテムのアクティビティ一覧を取得（タイムライン表示用）
 */
export async function fetchItemActivities(
  input: FetchItemActivitiesInput,
): Promise<ApiResponse<PagedResponseOfActivityResponse>> {
  const parseResult = fetchItemActivitiesInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const result = await api.activity.getApiWorkspacesItemsActivities(
      parseResult.data.workspaceId,
      parseResult.data.itemId,
      parseResult.data.page ?? 1,
    );
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchItemActivities error:', error);
    return handleApiErrorForAction<PagedResponseOfActivityResponse>(error, {
      defaultMessage: 'アクティビティの取得に失敗しました。',
    });
  }
}

/**
 * マイアクティビティ一覧を取得（ユーザー活動レポート用）
 */
export async function fetchMyActivities(
  input: FetchMyActivitiesInput = {},
): Promise<ApiResponse<PagedResponseOfActivityResponse>> {
  const parseResult = fetchMyActivitiesInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const api = await createPecusApiClients();
    const result = await api.my.getApiMyActivities(
      parseResult.data.page ?? 1,
      parseResult.data.period as ActivityPeriod,
    );
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchMyActivities error:', error);
    return handleApiErrorForAction<PagedResponseOfActivityResponse>(error, {
      defaultMessage: 'アクティビティの取得に失敗しました。',
    });
  }
}
