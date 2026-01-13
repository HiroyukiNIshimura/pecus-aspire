'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getUserAchievements } from '@/actions/user';
import type { AchievementCategory, AchievementDifficulty, UserAchievementResponse } from '@/connectors/api/pecus';
import { Tooltip } from '../../feedback/Tooltip';

/**
 * ユーザーバッジモーダルのProps
 */
export interface UserBadgesModalProps {
  /** モーダル表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 対象ユーザーID */
  userId: number;
  /** 対象ユーザー名 */
  userName: string;
}

/** 難易度の表示設定 */
const difficultyConfig: Record<AchievementDifficulty, { label: string; color: string; stars: number }> = {
  Easy: { label: '簡単', color: 'text-success', stars: 1 },
  Medium: { label: '普通', color: 'text-warning', stars: 2 },
  Hard: { label: '難しい', color: 'text-error', stars: 3 },
};

/** デフォルトの難易度設定（フォールバック用） */
const defaultDifficultyConfig = { label: '不明', color: 'text-base-content/50', stars: 0 };

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
 * 日付をフォーマット
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * バッジアイコンURLを取得
 */
function getBadgeIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) {
    return '/icons/badge/unknown.webp';
  }
  return `/icons/badge/${iconPath}`;
}

/**
 * ユーザーバッジ表示モーダル
 * - 指定ユーザーの取得済みバッジを表示
 * - 公開範囲に基づきフィルタリング済み（バックエンド処理）
 */
export default function UserBadgesModal({ isOpen, onClose, userId, userName }: UserBadgesModalProps) {
  const [badges, setBadges] = useState<UserAchievementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<UserAchievementResponse | null>(null);

  // モーダル表示時にデータ取得
  useEffect(() => {
    if (!isOpen) return;

    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getUserAchievements(userId);
      if (result.success) {
        setBadges(result.data);
      } else {
        setError(result.message ?? 'バッジの取得に失敗しました');
      }
      setIsLoading(false);
    };

    fetchBadges();
  }, [isOpen, userId]);

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="icon-[mdi--medal] size-5 text-warning" aria-hidden="true" />
            {userName}のバッジ
          </h2>
          <button type="button" className="btn btn-sm btn-circle btn-secondary" onClick={onClose} aria-label="閉じる">
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}

          {error && (
            <div className="alert alert-soft alert-error">
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && badges.length === 0 && (
            <div className="text-center py-8 text-base-content/60">
              <span className="icon-[mdi--medal-outline] size-12 mx-auto mb-2 block" aria-hidden="true" />
              <p>バッジはまだ獲得していないか、非公開に設定されています</p>
            </div>
          )}

          {!isLoading && !error && badges.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {badges.map((badge) => {
                const diffConfig = difficultyConfig[badge.difficulty] ?? defaultDifficultyConfig;
                return (
                  <Tooltip key={badge.id} text={badge.description} position="bottom" className="w-full">
                    <button
                      type="button"
                      className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer w-full"
                      onClick={() => setSelectedBadge(badge)}
                    >
                      <div className="card-body items-center text-center p-3 gap-1">
                        {/* バッジアイコン */}
                        <Image
                          src={getBadgeIconUrl(badge.iconPath)}
                          alt={badge.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 object-contain"
                        />
                        {/* バッジ名 */}
                        <p className="text-xs font-medium line-clamp-2 h-8">{badge.name}</p>
                        {/* 難易度の星 */}
                        <div className={`flex gap-0.5 ${diffConfig.color}`}>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <span
                              key={`star-${badge.id}-${i}`}
                              className={`icon-[mdi--star] text-xs ${i < diffConfig.stars ? '' : 'opacity-20'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end p-4 border-t border-base-300 shrink-0">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>

      {/* バッジ詳細モーダル */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedBadge(null)}
          onKeyDown={() => {}}
        >
          <div
            className="bg-base-100 rounded-box shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={() => {}}
          >
            <button
              type="button"
              className="btn btn-sm btn-circle btn-secondary absolute right-2 top-2"
              onClick={() => setSelectedBadge(null)}
            >
              <span className="icon-[mdi--close]" aria-hidden="true" />
            </button>

            <div className="flex flex-col items-center gap-4">
              {/* バッジアイコン（大） */}
              <Image
                src={getBadgeIconUrl(selectedBadge.iconPath)}
                alt={selectedBadge.name}
                width={128}
                height={128}
                className="w-32 h-32 object-contain"
              />

              {/* バッジ名 */}
              <h3 className="font-bold text-xl">{selectedBadge.name}</h3>

              {/* 説明 */}
              <p className="text-base-content/70 text-center">{selectedBadge.description}</p>

              {/* メタ情報 */}
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/50">カテゴリ</span>
                  <span>{categoryLabels[selectedBadge.category]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/50">難易度</span>
                  <span
                    className={`flex items-center gap-1 ${(difficultyConfig[selectedBadge.difficulty] ?? defaultDifficultyConfig).color}`}
                  >
                    {(difficultyConfig[selectedBadge.difficulty] ?? defaultDifficultyConfig).label}
                    <span className="flex gap-0.5">
                      {Array.from({
                        length: (difficultyConfig[selectedBadge.difficulty] ?? defaultDifficultyConfig).stars,
                      }).map((_, i) => (
                        <span key={`detail-star-${selectedBadge.id}-${i}`} className="icon-[mdi--star] text-xs" />
                      ))}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/50">獲得日</span>
                  <span>{formatDate(selectedBadge.earnedAt)}</span>
                </div>
              </div>

              {/* ステータス */}
              <div className="badge badge-success gap-1">
                <span className="icon-[mdi--check-circle] text-sm" />
                獲得済み
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
