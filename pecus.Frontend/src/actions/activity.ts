'use server';

import { getItemActivitiesWithHeyApi, getMyActivitiesWithHeyApi } from '@/connectors/HeyApiClient';
import type { PagedResponseOfActivityResponse } from '@/connectors/hey-api-axios/types.gen';
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
    const result = await getItemActivitiesWithHeyApi(
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
    const result = await getMyActivitiesWithHeyApi(parseResult.data.page ?? 1, parseResult.data.period ?? undefined);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('fetchMyActivities error:', error);
    return handleApiErrorForAction<PagedResponseOfActivityResponse>(error, {
      defaultMessage: 'アクティビティの取得に失敗しました。',
    });
  }
}
