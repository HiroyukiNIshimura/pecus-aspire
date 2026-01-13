'use client';

import { useEffect, useState } from 'react';
import { getUserAchievements } from '@/actions/user';
import type { UserAchievementResponse } from '@/connectors/api/pecus';
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

/**
 * 日付をフォーマット（YYYY/MM/DD）
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
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
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
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
        <div className="flex-1 overflow-y-auto p-4">
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
              {badges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center text-center group">
                  {/* バッジアイコン */}
                  <Tooltip text={badge.description} position="bottom" className="flex-1">
                    <div className={`w-14 h-14 rounded-full overflow-hidden bg-amber-50`}>
                      <img
                        src={getBadgeIconUrl(badge.iconPath)}
                        alt={badge.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </Tooltip>
                  {/* バッジ名 */}
                  <p className="text-xs font-medium mt-1.5 line-clamp-2">{badge.name}</p>
                  {/* 取得日 */}
                  <p className="text-xs text-base-content/50">{formatDate(badge.earnedAt)}</p>
                </div>
              ))}
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
    </div>
  );
}
