'use client';

import { useCallback } from 'react';
import { markAchievementNotified } from '@/actions/achievement';
import AchievementCelebrationModal from '@/components/common/overlays/AchievementCelebrationModal';
import { useAchievementCelebrationStore } from '@/stores/achievementCelebrationStore';

/**
 * バッジ取得演出プロバイダー
 *
 * アプリケーション全体でバッジ取得演出モーダルを表示するためのプロバイダーです。
 * レイアウトの上位に配置してください。
 */
export function AchievementCelebrationProvider({ children }: { children: React.ReactNode }) {
  const { achievements, isShowing, closeCelebration } = useAchievementCelebrationStore();

  const handleClose = useCallback(
    async (achievementIds: number[]) => {
      closeCelebration();

      // バックグラウンドで通知済みマーク
      await Promise.allSettled(achievementIds.map((id) => markAchievementNotified(id)));
    },
    [closeCelebration],
  );

  return (
    <>
      {children}
      {isShowing && achievements.length > 0 && (
        <AchievementCelebrationModal achievements={achievements} onClose={handleClose} />
      )}
    </>
  );
}
