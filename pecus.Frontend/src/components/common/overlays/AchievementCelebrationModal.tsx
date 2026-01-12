'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import type { NewAchievementResponse } from '@/connectors/api/pecus';

interface AchievementCelebrationModalProps {
  /** 新規取得バッジのリスト */
  achievements: NewAchievementResponse[];
  /** モーダルを閉じる際のコールバック（通知済みマーク処理を含む） */
  onClose: (achievementIds: number[]) => void;
}

const difficultyConfig: Record<string, { label: string; stars: number; color: string }> = {
  Easy: { label: '初級', stars: 1, color: 'text-success' },
  Medium: { label: '中級', stars: 2, color: 'text-warning' },
  Hard: { label: '上級', stars: 3, color: 'text-error' },
};

const defaultDifficultyConfig = { label: '???', stars: 1, color: 'text-base-content' };

/**
 * バッジ取得演出モーダル
 *
 * タスク完了時に新規取得したバッジを祝福表示します。
 * 複数バッジ取得時はスライドショー形式で表示します。
 */
export default function AchievementCelebrationModal({ achievements, onClose }: AchievementCelebrationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const currentAchievement = achievements[currentIndex];
  const isLast = currentIndex === achievements.length - 1;
  const diffConfig = difficultyConfig[currentAchievement?.difficulty ?? ''] ?? defaultDifficultyConfig;

  const handleNext = useCallback(() => {
    if (isLast) {
      setIsVisible(false);
      setTimeout(() => {
        onClose(achievements.map((a) => a.id));
      }, 300);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [isLast, achievements, onClose]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(achievements.map((a) => a.id));
    }, 300);
  }, [achievements, onClose]);

  useEffect(() => {
    if (achievements.length > 0) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [achievements.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' || e.key === ' ') {
        handleNext();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handleNext]);

  if (!currentAchievement) {
    return null;
  }

  const iconPath = currentAchievement.iconPath
    ? `/icons/badge/${currentAchievement.iconPath}`
    : '/icons/badge/unknown.webp';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievement-modal-title"
    >
      <div
        className={`bg-base-100 rounded-box shadow-2xl w-full max-w-sm text-center transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-linear-to-b from-primary/20 to-transparent rounded-t-box pt-8 pb-4">
          <div className="text-4xl mb-2 animate-bounce">🎉</div>
          <h2 id="achievement-modal-title" className="text-xl font-bold text-primary">
            バッジ獲得！
          </h2>
        </div>

        <div className="p-6">
          <div className="relative w-24 h-24 mx-auto mb-4 animate-float">
            <Image
              src={iconPath}
              alt={currentAchievement.name}
              fill
              className="object-contain drop-shadow-lg"
              sizes="96px"
            />
          </div>

          <h3 className="text-lg font-bold mb-2">{currentAchievement.name}</h3>

          <div className={`flex items-center justify-center gap-1 mb-3 ${diffConfig.color}`}>
            {Array.from({ length: diffConfig.stars }).map((_, i) => (
              <span key={`star-${currentAchievement.id}-${i}`} className="icon-[tabler--star-filled] size-4" />
            ))}
            <span className="text-sm ml-1">{diffConfig.label}</span>
          </div>

          <p className="text-sm text-base-content/70 mb-4">{currentAchievement.description}</p>

          {achievements.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-4">
              {achievements.map((achievement) => (
                <div
                  key={`dot-${achievement.id}`}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    achievement.id === currentAchievement.id ? 'bg-primary' : 'bg-base-300'
                  }`}
                />
              ))}
            </div>
          )}

          <button type="button" className="btn btn-primary btn-wide" onClick={handleNext}>
            {isLast ? '閉じる' : '次へ'}
          </button>
        </div>
      </div>
    </div>
  );
}
