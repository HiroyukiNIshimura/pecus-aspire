'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { getUserAchievements } from '@/actions/user';
import type { AchievementCategory, AchievementDifficulty, UserAchievementResponse } from '@/connectors/api/pecus';

/**
 * ユーザーバッジポップオーバーのProps
 */
export interface UserBadgesPopoverProps {
  /** ポップオーバー表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 対象ユーザーID */
  userId: number;
  /** 対象ユーザー名 */
  userName: string;
  /** アンカー要素の位置情報 */
  anchorRect?: DOMRect | null;
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
 * ユーザーバッジ表示ポップオーバー
 * - 指定ユーザーの取得済みバッジをポップオーバーで表示
 * - 公開範囲に基づきフィルタリング済み（バックエンド処理）
 */
export default function UserBadgesPopover({ isOpen, onClose, userId, userName, anchorRect }: UserBadgesPopoverProps) {
  const [badges, setBadges] = useState<UserAchievementResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<UserAchievementResponse | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // ポップオーバー表示時にデータ取得
  useEffect(() => {
    if (!isOpen) {
      // 閉じた時に選択バッジをリセット
      setSelectedBadge(null);
      return;
    }

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

  // 外部クリックで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBadge) {
          setSelectedBadge(null);
        } else {
          onClose();
        }
      }
    };

    // 少し遅延させてクリックイベントを登録（トリガー要素のクリックを無視するため）
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, selectedBadge]);

  if (!isOpen) return null;

  // ポップオーバーの位置計算
  const getPopoverStyle = (): React.CSSProperties => {
    if (!anchorRect) {
      // アンカーがない場合は画面中央
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const popoverWidth = 400;
    const popoverHeight = 400;
    const margin = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // デフォルトは下に表示
    let top = anchorRect.bottom + margin;
    let left = anchorRect.left;

    // 右端からはみ出す場合は左にずらす
    if (left + popoverWidth > viewportWidth - margin) {
      left = viewportWidth - popoverWidth - margin;
    }

    // 左端からはみ出す場合
    if (left < margin) {
      left = margin;
    }

    // 下にスペースがない場合は上に表示
    if (top + popoverHeight > viewportHeight - margin) {
      top = anchorRect.top - popoverHeight - margin;
    }

    // 上にもスペースがない場合は画面内に収める
    if (top < margin) {
      top = margin;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  return (
    <>
      {/* オーバーレイ（薄い背景） */}
      <div className="fixed inset-0 z-40 bg-black/20" aria-hidden="true" />

      {/* ポップオーバー本体 */}
      <div
        ref={popoverRef}
        className="z-50 bg-base-100 rounded-box shadow-xl w-[400px] max-h-[70vh] flex flex-col border border-base-300"
        style={getPopoverStyle()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-badges-title"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-3 border-b border-base-300 shrink-0">
          <h2 id="user-badges-title" className="text-base font-bold flex items-center gap-2">
            <span className="icon-[mdi--medal] size-5 text-warning" aria-hidden="true" />
            {userName}のバッジ
          </h2>
          <button type="button" className="btn btn-xs btn-circle btn-secondary" onClick={onClose} aria-label="閉じる">
            <span className="icon-[mdi--close] size-4" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading && (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner loading-md" />
            </div>
          )}

          {error && (
            <div className="alert alert-soft alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && badges.length === 0 && (
            <div className="text-center py-6 text-base-content/60">
              <span className="icon-[mdi--medal-outline] size-10 mx-auto mb-2 block" aria-hidden="true" />
              <p className="text-sm">バッジはまだ獲得していないか、非公開に設定されています</p>
            </div>
          )}

          {!isLoading && !error && badges.length > 0 && !selectedBadge && (
            <div className="grid grid-cols-4 gap-2">
              {badges.map((badge) => {
                const diffConfig = difficultyConfig[badge.difficulty] ?? defaultDifficultyConfig;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
                    onClick={() => setSelectedBadge(badge)}
                    title={badge.description}
                  >
                    <div className="card-body items-center text-center p-2 gap-0.5">
                      {/* バッジアイコン */}
                      <Image
                        src={getBadgeIconUrl(badge.iconPath)}
                        alt={badge.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 object-contain"
                      />
                      {/* バッジ名 */}
                      <p className="text-xs font-medium line-clamp-1">{badge.name}</p>
                      {/* 難易度の星 */}
                      <div className={`flex gap-0.5 ${diffConfig.color}`}>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span
                            key={`star-${badge.id}-${i}`}
                            className={`icon-[mdi--star] text-[10px] ${i < diffConfig.stars ? '' : 'opacity-20'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* バッジ詳細表示 */}
          {selectedBadge && (
            <div className="animate-in fade-in duration-150">
              <button type="button" className="btn btn-xs btn-secondary mb-3" onClick={() => setSelectedBadge(null)}>
                <span className="icon-[mdi--arrow-left] size-4" aria-hidden="true" />
                一覧に戻る
              </button>

              <div className="flex flex-col items-center gap-3">
                {/* バッジアイコン（大） */}
                <Image
                  src={getBadgeIconUrl(selectedBadge.iconPath)}
                  alt={selectedBadge.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-contain"
                />

                {/* バッジ名 */}
                <h3 className="font-bold text-lg">{selectedBadge.name}</h3>

                {/* 説明 */}
                <p className="text-sm text-base-content/70 text-center">{selectedBadge.description}</p>

                {/* メタ情報 */}
                <div className="w-full space-y-1.5 text-sm">
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
                <div className="badge badge-success gap-1 badge-sm">
                  <span className="icon-[mdi--check-circle] text-xs" />
                  獲得済み
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター（バッジ数表示） */}
        {!isLoading && !error && badges.length > 0 && (
          <div className="flex justify-center p-2 border-t border-base-300 shrink-0 text-xs text-base-content/60">
            {badges.length}個のバッジを獲得
          </div>
        )}
      </div>
    </>
  );
}
