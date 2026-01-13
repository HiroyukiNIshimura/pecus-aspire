'use server';

import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  AchievementCollectionResponse,
  AchievementRankingResponse,
  NewAchievementResponse,
  UserAchievementResponse,
} from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * Server Action: 全実績マスタを取得（コレクションページ用）
 * 未取得の実績は名前・説明・アイコンが隠蔽される
 */
export async function getAchievementCollection(): Promise<ApiResponse<AchievementCollectionResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.achievement.getApiAchievements();
    return { success: true, data: response };
  } catch (error) {
    return handleApiErrorForAction(error, { defaultMessage: '実績情報の取得に失敗しました' });
  }
}

/**
 * Server Action: 自分の取得済み実績を取得
 */
export async function getMyAchievements(): Promise<ApiResponse<UserAchievementResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.achievement.getApiAchievementsMe();
    return { success: true, data: response };
  } catch (error) {
    return handleApiErrorForAction(error, { defaultMessage: '取得済み実績の取得に失敗しました' });
  }
}

/**
 * Server Action: 未通知の実績を取得
 * バッジ取得演出の表示判定に使用
 */
export async function getUnnotifiedAchievements(): Promise<ApiResponse<NewAchievementResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.achievement.getApiAchievementsMeUnnotified();
    return { success: true, data: response };
  } catch (error) {
    return handleApiErrorForAction(error, { defaultMessage: '未通知実績の取得に失敗しました' });
  }
}

/**
 * Server Action: 実績を通知済みにマーク
 * バッジ取得演出を表示した後に呼び出す
 */
export async function markAchievementNotified(achievementId: number): Promise<ApiResponse<void>> {
  try {
    const api = createPecusApiClients();
    await api.achievement.postApiAchievementsMeNotify(achievementId);
    return { success: true, data: undefined };
  } catch (error) {
    return handleApiErrorForAction(error, { defaultMessage: '通知済みマークに失敗しました' });
  }
}

/**
 * Server Action: バッジ獲得ランキングを取得
 * @param workspaceId ワークスペースID（指定時はそのワークスペース内でのランキング）
 */
export async function getAchievementRanking(workspaceId?: number): Promise<ApiResponse<AchievementRankingResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.achievement.getApiAchievementsRanking(workspaceId);
    return { success: true, data: response };
  } catch (error) {
    return handleApiErrorForAction(error, { defaultMessage: 'ランキングの取得に失敗しました' });
  }
}
