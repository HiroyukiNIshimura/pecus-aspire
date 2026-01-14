'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import AvatarImage from '@/components/common/widgets/user/AvatarImage';
import UserBadgesPopover from '@/components/common/widgets/user/UserBadgesPopover';
import type { AchievementRankingResponse, RankingItemDto } from '@/connectors/api/pecus';

/**
 * ランキング種別
 */
type RankingType = 'difficulty' | 'count' | 'growth';

/**
 * ランキング種別の設定
 */
const rankingConfig: Record<RankingType, { label: string; icon: string; scoreLabel: string; scoreUnit: string }> = {
  difficulty: {
    label: '難易度',
    icon: 'icon-[mdi--star-shooting]',
    scoreLabel: '難易度Pt',
    scoreUnit: 'pt',
  },
  count: {
    label: '取得数',
    icon: 'icon-[mdi--trophy]',
    scoreLabel: 'バッジ数',
    scoreUnit: '個',
  },
  growth: {
    label: '成長速度',
    icon: 'icon-[mdi--rocket-launch]',
    scoreLabel: '成長率',
    scoreUnit: '',
  },
};

/**
 * 順位に応じた装飾（控えめなデザイン）
 */
const rankStyles: Record<number, { badge: string; text: string }> = {
  1: { badge: 'badge-primary', text: 'text-primary' },
  2: { badge: 'badge-secondary', text: 'text-secondary' },
  3: { badge: 'badge-accent', text: 'text-accent' },
};

interface BadgeRankingCardProps {
  /** ランキングデータ */
  data: AchievementRankingResponse | null;
  /** ローディング状態 */
  isLoading?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

/**
 * バッジ獲得ランキングカード
 *
 * 3種類のランキングをタブ切り替えで表示:
 * - 難易度ランカー: 難しいバッジを多く取得している人
 * - 取得数ランカー: バッジ総数が多い人
 * - 成長速度ランカー: 期間あたりの取得効率が高い人
 */
export default function BadgeRankingCard({ data, isLoading = false, className = '' }: BadgeRankingCardProps) {
  const [activeTab, setActiveTab] = useState<RankingType>('difficulty');
  // ユーザーバッジポップオーバーの状態
  const [badgePopoverUser, setBadgePopoverUser] = useState<{
    userId: number;
    displayName: string;
    anchorRect: DOMRect;
  } | null>(null);

  // 現在のタブのランキングデータを取得
  const getCurrentRanking = (): RankingItemDto[] => {
    if (!data) return [];
    switch (activeTab) {
      case 'difficulty':
        return data.difficultyRanking;
      case 'count':
        return data.countRanking;
      case 'growth':
        return data.growthRanking;
      default:
        return [];
    }
  };

  const currentRanking = getCurrentRanking();
  const currentConfig = rankingConfig[activeTab];

  // スコアのフォーマット
  const formatScore = (score: number, type: RankingType): string => {
    if (type === 'growth') {
      return score.toFixed(1);
    }
    return Math.floor(score).toString();
  };

  return (
    <section
      aria-labelledby="badge-ranking-heading"
      className={`card bg-base-100 shadow-sm border border-base-300 ${className}`}
    >
      <div className="card-body p-4 gap-2">
        {/* ヘッダー */}
        <h2 id="badge-ranking-heading" className="text-lg font-semibold flex items-center gap-2">
          <span className="icon-[mdi--medal-outline] w-5 h-5 text-primary" aria-hidden="true" />
          バッジ獲得ランキング
        </h2>

        {/* タブ */}
        <div className="tabs tabs-box" role="tablist" aria-label="ランキング種別">
          {(Object.keys(rankingConfig) as RankingType[]).map((type) => {
            const config = rankingConfig[type];
            const isActive = activeTab === type;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`ranking-panel-${type}`}
                className={`tab flex-1 gap-1 text-xs ${isActive ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(type)}
              >
                <span className={`${config.icon} w-4 h-4`} aria-hidden="true" />
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* ランキングパネル */}
        <div id={`ranking-panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="mt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md text-primary" aria-label="読み込み中" />
            </div>
          ) : currentRanking.length === 0 ? (
            <EmptyState iconClass="icon-[mdi--podium]" message="該当するランカーがまだいません" size="sm" />
          ) : (
            <ul className="space-y-1" aria-label={`${currentConfig.label}ランキング`}>
              {currentRanking.map((item) => {
                const style = rankStyles[item.rank] || { badge: 'badge-neutral', text: 'text-base-content' };
                return (
                  <li key={item.userId}>
                    <button
                      type="button"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/50 cursor-pointer w-full text-left transition-colors"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setBadgePopoverUser({
                          userId: item.userInternalId,
                          displayName: item.displayName,
                          anchorRect: rect,
                        });
                      }}
                      aria-label={`${item.displayName}のバッジを表示`}
                    >
                      {/* 順位 */}
                      <div className="flex-shrink-0">
                        <span className={`badge badge-sm ${style.badge}`}>{item.rank}</span>
                      </div>

                      {/* アバター */}
                      <div className="flex-shrink-0">
                        <AvatarImage src={item.avatarUrl} alt="" size={32} />
                      </div>

                      {/* ユーザー情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.displayName}</div>
                        <div className="text-xs text-base-content/50">{item.badgeCount}個</div>
                      </div>

                      {/* スコア */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-sm font-semibold ${style.text}`}>
                          {formatScore(item.score, activeTab)}
                          <span className="text-xs font-normal ml-0.5 text-base-content/60">
                            {currentConfig.scoreUnit}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ユーザーバッジポップオーバー */}
      <UserBadgesPopover
        isOpen={badgePopoverUser !== null}
        onClose={() => setBadgePopoverUser(null)}
        userId={badgePopoverUser?.userId ?? 0}
        userName={badgePopoverUser?.displayName ?? ''}
        anchorRect={badgePopoverUser?.anchorRect}
      />
    </section>
  );
}
