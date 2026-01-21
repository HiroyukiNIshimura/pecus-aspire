'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchItemActivities } from '@/actions/activity';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { ActivityResponse } from '@/connectors/api/pecus';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { actionTypeConfig, actionTypeLabels, defaultActionConfig, formatDetails } from '@/libs/activity/activityUtils';
import { formatFullDateJa, formatTime } from '@/libs/utils/date';

interface ItemActivityTimelineProps {
  workspaceId: number;
  itemId: number;
  isOpen: boolean;
  onClose: () => void;
}

/** 日付をグループ化するためのキーを取得 */
function getDateKey(dateString: string): string {
  return formatFullDateJa(dateString);
}

export default function ItemActivityTimeline({ workspaceId, itemId, isOpen, onClose }: ItemActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // データ取得
  const loadActivities = useCallback(async () => {
    try {
      const result = await fetchItemActivities(workspaceId, itemId, page);

      if (!result.success) {
        setError(result.message || 'アクティビティの取得に失敗しました。');
        return;
      }

      const newActivities = result.data.data || [];
      setActivities((prev) => (page === 1 ? newActivities : [...prev, ...newActivities]));
      setHasMore(page < (result.data.totalPages || 1));
      setPage((prev) => prev + 1);
    } catch {
      setError('アクティビティの取得に失敗しました。');
    }
  }, [page, workspaceId, itemId]);

  // useInfiniteScroll フックを使用
  const {
    sentinelRef,
    isLoading,
    reset: resetInfiniteScroll,
  } = useInfiniteScroll({
    onLoadMore: loadActivities,
    hasMore,
    rootMargin: '100px',
    disabled: !isOpen,
  });

  // 初期化
  useEffect(() => {
    if (isOpen) {
      setActivities([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      setIsFirstLoad(true);
      resetInfiniteScroll();
    }
  }, [isOpen, itemId, resetInfiniteScroll]);

  // 初回読み込み
  useEffect(() => {
    if (isOpen && isFirstLoad && activities.length === 0 && !isLoading && !error) {
      setIsFirstLoad(false);
      loadActivities();
    }
  }, [isOpen, isFirstLoad, activities.length, isLoading, error, loadActivities]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 日付でグループ化
  const groupedActivities: { date: string; items: ActivityResponse[] }[] = [];
  let currentDate = '';
  for (const activity of activities) {
    const dateKey = activity.createdAt ? getDateKey(activity.createdAt) : '不明な日付';
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groupedActivities.push({ date: dateKey, items: [] });
    }
    groupedActivities[groupedActivities.length - 1].items.push(activity);
  }

  return (
    <>
      {/* 背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-60" onClick={onClose} aria-hidden="true" />

      {/* モーダル */}
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div
          className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h3 className="font-bold text-lg">タイムライン</h3>
            <button type="button" onClick={onClose} className="btn btn-sm btn-soft btn-secondary btn-circle">
              <span className="icon-[mdi--close] size-5" aria-hidden="true" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-4">
            {error ? (
              <div className="alert alert-soft alert-error">
                <span>{error}</span>
              </div>
            ) : activities.length === 0 && !isLoading ? (
              <EmptyState iconClass="icon-[mdi--history]" message="アクティビティはありません" size="sm" />
            ) : (
              <div className="space-y-4">
                {groupedActivities.map((group, groupIndex) => {
                  return (
                    <div key={group.date}>
                      {/* 日付ラベル */}
                      <div className={`text-sm text-base-content/70 mb-2 ${groupIndex > 0 ? 'mt-4' : ''}`}>
                        {group.date}
                      </div>

                      {/* アクティビティリスト */}
                      <div className="relative pl-6">
                        {/* 縦線 */}
                        <div className="absolute left-2.25 top-2 bottom-2 w-0.5 bg-base-300" />

                        {group.items.map((activity) => {
                          const config =
                            activity.actionType && actionTypeConfig[activity.actionType]
                              ? actionTypeConfig[activity.actionType]
                              : defaultActionConfig;
                          const label =
                            activity.actionType && actionTypeLabels[activity.actionType]
                              ? actionTypeLabels[activity.actionType]
                              : '不明な操作';
                          const details = activity.actionType
                            ? formatDetails(activity.actionType, activity.details)
                            : null;
                          const time = activity.createdAt ? formatTime(activity.createdAt) : '';

                          return (
                            <div key={activity.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
                              {/* アイコン */}
                              <div
                                className={`absolute -left-6 badge ${config.badgeClass} size-5 rounded-full p-0 flex items-center justify-center`}
                              >
                                <span className={`${config.icon} size-3`} aria-hidden="true" />
                              </div>

                              {/* コンテンツ */}
                              <div className="flex-1 min-w-0">
                                {/* 1行目: ラベル + 時間 */}
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium ms-1">{label}</p>
                                  <span className="text-xs text-base-content/50 whitespace-nowrap">{time}</span>
                                </div>
                                {/* 2行目: UserAvatar */}
                                <div className="mt-2">
                                  <UserAvatar
                                    userName={activity.user?.username}
                                    identityIconUrl={activity.user?.identityIconUrl}
                                    size={32}
                                    nameClassName="text-sm text-base-content/70"
                                  />
                                </div>
                                {/* 3行目: 詳細 */}
                                {details && <p className="text-sm text-base-content/70 mt-2 truncate">{details}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ローディング & 無限スクロールトリガー */}
            <div ref={sentinelRef} aria-hidden="true" />
            {isLoading && (
              <div className="py-8 flex justify-center">
                <span className="loading loading-spinner loading-md" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
