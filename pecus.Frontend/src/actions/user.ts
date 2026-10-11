'use server';
import { getUserAchievementsWithHeyApi, getUserSkillsWithHeyApi } from '@/connectors/HeyApiClient';
import type { UserAchievementResponse, UserSkillDetailResponse } from '@/connectors/hey-api-axios/types.gen';
import {
  type GetUserAchievementsInput,
  type GetUserSkillsInput,
  getUserAchievementsInputSchema,
  getUserSkillsInputSchema,
} from '@/schemas/userSchemas';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';
import { validationError } from './types';

/**
 * Server Action: 指定ユーザーの取得済み実績を取得
 * 公開範囲設定に基づきフィルタリングされる
 */
export async function getUserAchievements(
  input: GetUserAchievementsInput,
): Promise<ApiResponse<UserAchievementResponse[]>> {
  const parseResult = getUserAchievementsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await getUserAchievementsWithHeyApi(parseResult.data.userId);
    return { success: true, data: response };
  } catch (error) {
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザー実績の取得に失敗しました' });
  }
}

/**
 * Server Action: 指定ユーザーのスキル一覧を取得
 */
export async function getUserSkills(input: GetUserSkillsInput): Promise<ApiResponse<UserSkillDetailResponse[]>> {
  const parseResult = getUserSkillsInputSchema.safeParse(input);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((issue) => issue.message).join(', ');
    return validationError(errorMessages);
  }

  try {
    const response = await getUserSkillsWithHeyApi(parseResult.data.userId);
    return { success: true, data: response };
  } catch (error) {
    return handleApiErrorForAction(error, { defaultMessage: 'ユーザースキルの取得に失敗しました' });
  }
}
