import { create } from 'zustand';
import type { NewAchievementResponse } from '@/connectors/api/pecus';

/**
 * バッジ演出状態
 */
interface AchievementCelebrationState {
  /** 表示するバッジリスト */
  achievements: NewAchievementResponse[];

  /** 演出表示中かどうか */
  isShowing: boolean;

  /**
   * バッジ演出を表示
   * @param achievements 新規取得したバッジリスト
   */
  showCelebration: (achievements: NewAchievementResponse[]) => void;

  /**
   * 演出を閉じる
   */
  closeCelebration: () => void;
}

/**
 * バッジ取得演出を管理するストア
 *
 * タスク完了時などにnewAchievementsが返された場合、
 * showCelebrationを呼び出して演出モーダルを表示します。
 */
export const useAchievementCelebrationStore = create<AchievementCelebrationState>((set) => ({
  achievements: [],
  isShowing: false,

  showCelebration: (achievements) => {
    if (achievements.length > 0) {
      set({ achievements, isShowing: true });
    }
  },

  closeCelebration: () => {
    set({ achievements: [], isShowing: false });
  },
}));
