'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { AchievementCategory, AchievementCollectionResponse, AchievementDifficulty } from '@/connectors/api/pecus';

interface BadgeCardProps {
  achievement: AchievementCollectionResponse;
}

/** 難易度の表示設定 */
const difficultyConfig: Record<AchievementDifficulty, { label: string; color: string; stars: number }> = {
  Easy: { label: '簡単', color: 'text-success', stars: 1 },
  Medium: { label: '普通', color: 'text-warning', stars: 2 },
  Hard: { label: '難しい', color: 'text-error', stars: 3 },
};

/** カテゴリの表示ラベル */
const categoryLabels: Record<AchievementCategory, string> = {
  WorkStyle: 'ワークスタイル',
  Productivity: '生産性',
  AI: 'AI',
  TeamPlay: 'チームワーク',
  Quality: '品質',
  Reliability: '信頼性',
};

/**
 * 個別バッジカードコンポーネント
 * 取得済み: カラー表示、未取得: グレースケール + "???"
 */
export default function BadgeCard({ achievement }: BadgeCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const { isEarned, name, description, iconPath, difficulty, category, earnedAt } = achievement;

  // アイコンパス: 未取得はunknown.webpを使用
  const badgeIconSrc = isEarned && iconPath ? `/icons/badge/${iconPath}` : '/icons/badge/unknown.webp';

  // 難易度設定
  const diffConfig = difficultyConfig[difficulty];

  // 取得日のフォーマット
  const formattedDate = earnedAt
    ? new Date(earnedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <>
      <button
        type="button"
        className={`card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer ${
          !isEarned ? 'opacity-60' : ''
        }`}
        onClick={() => setShowDetail(true)}
      >
        <div className="card-body items-center text-center p-3 gap-2">
          {/* バッジアイコン */}
          <div className="relative">
            <Image
              src={badgeIconSrc}
              alt={isEarned ? name : '???'}
              width={64}
              height={64}
              className={`w-16 h-16 object-contain ${!isEarned ? 'grayscale' : ''}`}
            />
            {/* 取得済みチェックマーク */}
            {isEarned && (
              <span className="absolute -bottom-1 -right-1 bg-success text-success-content rounded-full p-0.5">
                <span className="icon-[mdi--check] text-sm" />
              </span>
            )}
          </div>

          {/* バッジ名 */}
          <p className="text-sm font-medium line-clamp-2 h-10">{isEarned ? name : '???'}</p>

          {/* 難易度の星 */}
          <div className={`flex gap-0.5 ${diffConfig.color}`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={`star-${achievement.id}-${i}`}
                className={`icon-[mdi--star] text-xs ${i < diffConfig.stars ? '' : 'opacity-20'}`}
              />
            ))}
          </div>
        </div>
      </button>

      {/* 詳細モーダル */}
      {showDetail && (
        <div className="modal modal-open" onClick={() => setShowDetail(false)} onKeyDown={() => {}}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()} onKeyDown={() => {}}>
            <button
              type="button"
              className="btn btn-sm btn-circle btn-secondary absolute right-2 top-2"
              onClick={() => setShowDetail(false)}
            >
              <span className="icon-[mdi--close]" />
            </button>

            <div className="flex flex-col items-center gap-4">
              {/* バッジアイコン（大） */}
              <Image
                src={badgeIconSrc}
                alt={isEarned ? name : '???'}
                width={128}
                height={128}
                className={`w-32 h-32 object-contain ${!isEarned ? 'grayscale' : ''}`}
              />

              {/* バッジ名 */}
              <h3 className="font-bold text-xl">{isEarned ? name : '???'}</h3>

              {/* 説明 */}
              <p className="text-base-content/70 text-center">{isEarned ? description : '???'}</p>

              {/* メタ情報 */}
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/50">カテゴリ</span>
                  <span>{categoryLabels[category]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/50">難易度</span>
                  <span className={`flex items-center gap-1 ${diffConfig.color}`}>
                    {diffConfig.label}
                    <span className="flex gap-0.5">
                      {Array.from({ length: diffConfig.stars }).map((_, i) => (
                        <span key={`modal-star-${achievement.id}-${i}`} className="icon-[mdi--star] text-xs" />
                      ))}
                    </span>
                  </span>
                </div>
                {isEarned && formattedDate && (
                  <div className="flex justify-between">
                    <span className="text-base-content/50">獲得日</span>
                    <span>{formattedDate}</span>
                  </div>
                )}
              </div>

              {/* ステータス */}
              {isEarned ? (
                <div className="badge badge-success gap-1">
                  <span className="icon-[mdi--check-circle] text-sm" />
                  獲得済み
                </div>
              ) : (
                <div className="badge badge-secondary gap-1">
                  <span className="icon-[mdi--lock-outline] text-sm" />
                  未獲得
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
