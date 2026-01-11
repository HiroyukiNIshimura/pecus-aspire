'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { fetchMyActivities } from '@/actions/activity';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import { Tooltip } from '@/components/common/feedback/Tooltip';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { ActivityPeriod, ActivityResponse, PagedResponseOfActivityResponse } from '@/connectors/api/pecus';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { actionTypeConfig, actionTypeLabels, defaultActionConfig, formatDetails } from '@/libs/activity/activityUtils';
import { formatFullDateJa, formatTime } from '@/libs/utils/date';

interface ActivityClientProps {
  initialUserName: string;
  initialUserIconUrl?: string | null;
  initialActivities: PagedResponseOfActivityResponse | null;
  fetchError: string | null;
}

/** 期間タブの設定 */
const periodTabs: { period: ActivityPeriod; label: string }[] = [
  { period: 'Today', label: '今日' },
  { period: 'Yesterday', label: '昨日' },
  { period: 'ThisWeek', label: '今週' },
  { period: 'LastWeek', label: '先週' },
  { period: 'ThisMonth', label: '今月' },
  { period: 'LastMonth', label: '先月' },
];

/** 日付をグループ化するためのキーを取得 */
function getDateKey(dateString: string): string {
  return formatFullDateJa(dateString);
}

export default function ActivityClient({
  initialUserName,
  initialUserIconUrl,
  initialActivities,
  fetchError,
}: ActivityClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ActivityPeriod>('Today');
  const [activities, setActivities] = useState<ActivityResponse[]>(initialActivities?.data || []);
  const [hasMore, setHasMore] = useState((initialActivities?.currentPage ?? 1) < (initialActivities?.totalPages ?? 1));
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(fetchError);

  // 追加データ読み込み
  const loadMore = useCallback(async () => {
    try {
      const result = await fetchMyActivities(page, selectedPeriod);
      if (result.success) {
        setActivities((prev) => [...prev, ...(result.data.data || [])]);
        setHasMore(page < (result.data.totalPages || 1));
        setPage((prev) => prev + 1);
      } else {
        setError(result.message || 'アクティビティの取得に失敗しました。');
      }
    } catch {
      setError('アクティビティの取得に失敗しました。');
    }
  }, [page, selectedPeriod]);

  // useInfiniteScroll フックを使用
  const {
    sentinelRef,
    isLoading,
    reset: resetInfiniteScroll,
  } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    rootMargin: '200px',
  });

  // 期間変更時にリセット
  const handlePeriodChange = useCallback(
    async (period: ActivityPeriod) => {
      setSelectedPeriod(period);
      setActivities([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      resetInfiniteScroll();

      try {
        const result = await fetchMyActivities(1, period);
        if (result.success) {
          setActivities(result.data.data || []);
          setHasMore(1 < (result.data.totalPages || 1));
          setPage(2);
        } else {
          setError(result.message || 'アクティビティの取得に失敗しました。');
        }
      } catch {
        setError('アクティビティの取得に失敗しました。');
      }
    },
    [resetInfiniteScroll],
  );

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
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <UserAvatar userName={initialUserName} identityIconUrl={initialUserIconUrl} size={48} showName={false} />
        <div>
          <h1 className="text-2xl font-bold">アクティビティ</h1>
          <p className="text-sm text-base-content/70">{initialUserName} さんの活動履歴</p>
        </div>
      </div>

      {/* 期間タブ */}
      <div className="tabs tabs-box mb-6 overflow-x-auto">
        {periodTabs.map((tab) => (
          <button
            key={tab.period}
            type="button"
            className={`tab whitespace-nowrap ${selectedPeriod === tab.period ? 'tab-active' : ''}`}
            onClick={() => handlePeriodChange(tab.period)}
            disabled={isLoading}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="alert alert-soft alert-error mb-6">
          <span className="icon-[mdi--alert-circle] size-5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* コンテンツ */}
      {activities.length === 0 && !isLoading && !error ? (
        <EmptyState iconClass="icon-[mdi--history]" message="この期間のアクティビティはありません" size="lg" />
      ) : (
        <div className="space-y-6">
          {groupedActivities.map((group, groupIndex) => (
            <div key={group.date}>
              {/* 日付ヘッダー */}
              <div
                className={`flex items-center gap-2 text-sm text-base-content/70 mb-4 ${groupIndex > 0 ? 'mt-8' : ''}`}
              >
                <span className="icon-[mdi--calendar] size-4" aria-hidden="true" />
                <span className="font-medium">{group.date}</span>
                <span className="text-base-content/50">({group.items.length}件)</span>
              </div>

              {/* アクティビティカードリスト */}
              <div className="space-y-3">
                {group.items.map((activity) => {
                  const config =
                    activity.actionType && actionTypeConfig[activity.actionType]
                      ? actionTypeConfig[activity.actionType]
                      : defaultActionConfig;
                  const label =
                    activity.actionType && actionTypeLabels[activity.actionType]
                      ? actionTypeLabels[activity.actionType]
                      : '不明な操作';
                  const details = activity.actionType ? formatDetails(activity.actionType, activity.details) : null;
                  const time = activity.createdAt ? formatTime(activity.createdAt) : '';

                  // アイテムへの遷移URL
                  const itemUrl = activity.workspaceCode
                    ? `/workspaces/${activity.workspaceCode}?itemCode=${activity.itemCode}`
                    : null;

                  return (
                    <div key={activity.id} className="card bg-base-100 shadow-sm border border-base-300">
                      <div className="card-body p-4">
                        {/* 1行目: アクションアイコン + ラベル + 時刻 */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`badge ${config.badgeClass} size-8 rounded-full p-0 flex items-center justify-center shrink-0`}
                          >
                            <span className={`${config.icon} size-4`} aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{label}</span>
                          </div>
                          <span className="text-xs text-base-content/50 whitespace-nowrap">{time}</span>
                        </div>

                        {/* 2行目: ワークスペース情報 */}
                        <div className="flex items-center gap-2 mt-2 ml-11">
                          {/* ワークスペースジャンルアイコン */}
                          {activity.workspaceGenreIcon && (
                            <img
                              src={`/icons/genres/${activity.workspaceGenreIcon}.svg`}
                              alt={activity.workspaceName || 'ジャンルアイコン'}
                              title={activity.workspaceName || 'ジャンル'}
                              className="w-4 h-4 flex-shrink-0"
                            />
                          )}
                          <span className="text-sm text-base-content/70 truncate">
                            {activity.workspaceName || 'Unknown'}
                          </span>
                          {activity.workspaceMode === 'Document' && (
                            <Tooltip text="ドキュメントモード" position="top">
                              <span
                                className="icon-[mdi--file-document-outline] w-3.5 h-3.5 text-base-content/60 flex-shrink-0"
                                aria-label="ドキュメントモード"
                              />
                            </Tooltip>
                          )}
                        </div>

                        {/* 3行目: アイテム情報 */}
                        <div className="flex items-center gap-2 mt-1 ml-11">
                          <span className="text-xs text-base-content/50 shrink-0">アイテム:</span>
                          {itemUrl ? (
                            <Link
                              href={itemUrl}
                              className="text-sm text-primary hover:underline truncate inline-flex items-center gap-1"
                            >
                              <span className="font-mono">#{activity.itemCode}</span>
                              <span className="truncate">{activity.itemSubject}</span>
                            </Link>
                          ) : (
                            <span className="text-sm truncate">
                              <span className="font-mono">#{activity.itemCode}</span> {activity.itemSubject}
                            </span>
                          )}
                        </div>

                        {/* 4行目: 詳細情報 */}
                        {details && (
                          <div className="mt-2 ml-11">
                            <p className="text-sm text-base-content/70 bg-base-200 rounded px-2 py-1 inline-block">
                              {details}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ローディング & 無限スクロールトリガー */}
      <div ref={sentinelRef} aria-hidden="true" />
      {isLoading && (
        <div className="py-8 flex justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
    </div>
  );
}
