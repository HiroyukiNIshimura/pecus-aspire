'use client';

import { useState } from 'react';
import type { AchievementCategory, AchievementCollectionResponse } from '@/connectors/api/pecus';
import { useAppSettings } from '@/providers/AppSettingsProvider';
import BadgeCard from './BadgeCard';

interface AchievementsClientProps {
  achievements: AchievementCollectionResponse[];
  fetchError: string | null;
}

/** カテゴリの表示ラベル */
const categoryLabels: Record<AchievementCategory, string> = {
  WorkStyle: 'ワークスタイル',
  Productivity: '生産性',
  AI: 'AI',
  TeamPlay: 'チームワーク',
  Quality: '品質',
  Reliability: '信頼性',
};

/** カテゴリ順序 */
const categoryOrder: AchievementCategory[] = ['WorkStyle', 'Productivity', 'AI', 'TeamPlay', 'Quality', 'Reliability'];

/**
 * バッジコレクションページのClient Component
 * カテゴリ別フィルタとグリッド表示
 */
export default function AchievementsClient({ achievements, fetchError }: AchievementsClientProps) {
  const { organization } = useAppSettings();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // ゲーミフィケーションが無効の場合
  if (!organization?.gamificationEnabled) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">バッジコレクション</h1>
        <div className="alert alert-info">
          <span className="icon-[mdi--information-outline] text-xl" />
          <span>ゲーミフィケーション機能は現在無効になっています。</span>
        </div>
      </div>
    );
  }

  // フィルタリング
  const filteredAchievements =
    selectedCategory === 'all' ? achievements : achievements.filter((a) => a.category === selectedCategory);

  // 取得済みバッジ数
  const earnedCount = achievements.filter((a) => a.isEarned).length;
  const totalCount = achievements.length;

  // カテゴリ別の取得済み数
  const categoryStats = categoryOrder.map((category) => {
    const categoryAchievements = achievements.filter((a) => a.category === category);
    const earned = categoryAchievements.filter((a) => a.isEarned).length;
    return { category, earned, total: categoryAchievements.length };
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="icon-[mdi--trophy-outline] text-warning text-3xl" />
          バッジコレクション
        </h1>
        <p className="text-base-content/70">タスクを完了してバッジを集めよう！</p>
      </div>

      {/* エラー表示 */}
      {fetchError && (
        <div className="alert alert-error">
          <span className="icon-[mdi--alert-circle-outline] text-xl" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* 統計 */}
      <div className="stats shadow bg-base-200">
        <div className="stat">
          <div className="stat-figure text-warning">
            <span className="icon-[mdi--trophy] text-4xl" />
          </div>
          <div className="stat-title">獲得バッジ</div>
          <div className="stat-value text-warning">
            {earnedCount} <span className="text-lg text-base-content/50">/ {totalCount}</span>
          </div>
          <div className="stat-desc">
            {totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0}% コンプリート
          </div>
        </div>
      </div>

      {/* カテゴリフィルタ */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory('all')}
        >
          すべて ({earnedCount}/{totalCount})
        </button>
        {categoryStats.map(({ category, earned, total }) => (
          <button
            key={category}
            type="button"
            className={`btn btn-sm ${selectedCategory === category ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory(category)}
          >
            {categoryLabels[category]} ({earned}/{total})
          </button>
        ))}
      </div>

      {/* バッジグリッド */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          <span className="icon-[mdi--trophy-variant-outline] text-6xl mb-4 block" />
          <p>バッジがありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-x-hidden">
          {filteredAchievements.map((achievement) => (
            <BadgeCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}
