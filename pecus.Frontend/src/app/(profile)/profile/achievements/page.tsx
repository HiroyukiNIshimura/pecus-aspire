import { redirect } from 'next/navigation';
import {
  createPecusApiClients,
  detect401ValidationError,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import type { AchievementCollectionResponse } from '@/connectors/api/pecus';
import AchievementsClient from './AchievementsClient';

export const dynamic = 'force-dynamic';

/**
 * バッジコレクションページ（Server Component）
 * SSR で実績マスタ（取得状況付き）を取得し、Client Component へ渡す
 */
export default async function AchievementsPage() {
  let achievements: AchievementCollectionResponse[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();
    // 全実績マスタを取得（未取得バッジは情報が隠蔽される）
    achievements = await api.achievement.getApiAchievements();
  } catch (error) {
    console.error('Failed to fetch achievements:', error);

    if (detect401ValidationError(error)) {
      redirect('/signin');
    }

    fetchError = getUserSafeErrorMessage(error, '実績情報の取得に失敗しました');
  }

  return <AchievementsClient achievements={achievements} fetchError={fetchError} />;
}
