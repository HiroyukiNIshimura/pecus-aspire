'use client';

import confetti from 'canvas-confetti';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NewAchievementResponse } from '@/connectors/api/pecus';

interface AchievementCelebrationModalProps {
  /** 新規取得バッジのリスト */
  achievements: NewAchievementResponse[];
  /** モーダルを閉じる際のコールバック（通知済みマーク処理を含む） */
  onClose: (achievementIds: number[]) => void;
}

interface DifficultyConfig {
  label: string;
  stars: number;
  color: string;
  glowColor: string;
  confetti: () => void;
}

/** Easy: シンプルなコンフェッティ */
const fireEasyConfetti = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#22c55e', '#86efac', '#bbf7d0'],
  });
};

/** Medium: ゴールドのコンフェッティ + 左右から発射 */
const fireMediumConfetti = () => {
  const colors = ['#eab308', '#fde047', '#fef08a', '#ffffff'];

  // 中央から
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors,
  });

  // 左から
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 50,
      origin: { x: 0, y: 0.6 },
      colors,
    });
  }, 150);

  // 右から
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 50,
      origin: { x: 1, y: 0.6 },
      colors,
    });
  }, 150);
};

/** Hard: 派手なフルコンフェッティ + 花火風 */
const fireHardConfetti = () => {
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ['#ef4444', '#f97316', '#eab308', '#ffffff', '#fbbf24'];

  // 連続発射
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  // 初回の大きな爆発
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.5 },
    colors,
    startVelocity: 45,
    gravity: 0.8,
  });

  // 星形パーティクル
  confetti({
    particleCount: 30,
    spread: 360,
    origin: { y: 0.5, x: 0.5 },
    colors: ['#ffd700', '#ffec8b'],
    shapes: ['star'],
    scalar: 1.2,
  });

  frame();
};

const difficultyConfig: Record<string, DifficultyConfig> = {
  Easy: {
    label: '初級',
    stars: 1,
    color: 'text-success',
    glowColor: 'shadow-success/50',
    confetti: fireEasyConfetti,
  },
  Medium: {
    label: '中級',
    stars: 2,
    color: 'text-warning',
    glowColor: 'shadow-warning/50',
    confetti: fireMediumConfetti,
  },
  Hard: {
    label: '上級',
    stars: 3,
    color: 'text-error',
    glowColor: 'shadow-error/50',
    confetti: fireHardConfetti,
  },
};

const defaultDifficultyConfig: DifficultyConfig = {
  label: '???',
  stars: 1,
  color: 'text-base-content',
  glowColor: '',
  confetti: fireEasyConfetti,
};

/**
 * バッジ取得演出モーダル
 *
 * タスク完了時に新規取得したバッジを祝福表示します。
 * 複数バッジ取得時はスライドショー形式で表示します。
 * 難易度に応じてコンフェッティ演出が変化します。
 */
export default function AchievementCelebrationModal({ achievements, onClose }: AchievementCelebrationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hasPlayedConfetti = useRef<Set<number>>(new Set());

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

  // 初期表示 & コンフェッティ発火
  useEffect(() => {
    if (achievements.length > 0) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [achievements.length]);

  // 各バッジ表示時のコンフェッティ発火（一度だけ）
  useEffect(() => {
    if (!currentAchievement) return;

    // prefers-reduced-motion を尊重
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // すでに発火済みの場合はスキップ
    if (hasPlayedConfetti.current.has(currentAchievement.id)) return;

    // 少し遅延させてモーダル表示後に発火
    const timer = setTimeout(() => {
      diffConfig.confetti();
      hasPlayedConfetti.current.add(currentAchievement.id);
    }, 200);

    return () => clearTimeout(timer);
  }, [currentAchievement, diffConfig]);

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
          <div
            className={`relative w-28 h-28 mx-auto mb-4 rounded-full ${diffConfig.glowColor} shadow-xl animate-badge-entrance`}
          >
            <div className="absolute inset-0 rounded-full animate-pulse-ring" />
            <Image
              src={iconPath}
              alt={currentAchievement.name}
              fill
              className="object-contain drop-shadow-lg p-2"
              sizes="112px"
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
