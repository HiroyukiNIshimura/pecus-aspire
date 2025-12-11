'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchItemActivities } from '@/actions/activity';
import UserAvatar from '@/components/common/UserAvatar';
import type { ActivityActionType, ActivityResponse } from '@/connectors/api/pecus';

interface ItemActivityTimelineProps {
  workspaceId: number;
  itemId: number;
  isOpen: boolean;
  onClose: () => void;
}

/** アクションタイプごとのアイコンと色の設定 */
const actionTypeConfig: Record<ActivityActionType, { icon: string; badgeClass: string }> = {
  Created: { icon: 'icon-[mdi--plus]', badgeClass: 'badge-success' },
  SubjectUpdated: { icon: 'icon-[mdi--pencil]', badgeClass: 'badge-primary' },
  BodyUpdated: { icon: 'icon-[mdi--text-box-edit]', badgeClass: 'badge-primary' },
  FileAdded: { icon: 'icon-[mdi--file-plus]', badgeClass: 'badge-success' },
  FileRemoved: { icon: 'icon-[mdi--file-remove]', badgeClass: 'badge-error' },
  StatusChanged: { icon: 'icon-[mdi--swap-horizontal]', badgeClass: 'badge-info' },
  AssigneeChanged: { icon: 'icon-[mdi--account-switch]', badgeClass: 'badge-info' },
  RelationAdded: { icon: 'icon-[mdi--link-plus]', badgeClass: 'badge-success' },
  RelationRemoved: { icon: 'icon-[mdi--link-off]', badgeClass: 'badge-error' },
  ArchivedChanged: { icon: 'icon-[mdi--archive]', badgeClass: 'badge-warning' },
  DraftChanged: { icon: 'icon-[mdi--file-edit]', badgeClass: 'badge-warning' },
  CommitterChanged: { icon: 'icon-[mdi--account-check]', badgeClass: 'badge-info' },
  PriorityChanged: { icon: 'icon-[mdi--flag]', badgeClass: 'badge-warning' },
  DueDateChanged: { icon: 'icon-[mdi--calendar]', badgeClass: 'badge-info' },
};

/** アクションタイプの日本語ラベル */
const actionTypeLabels: Record<ActivityActionType, string> = {
  Created: 'アイテムを作成',
  SubjectUpdated: '件名を更新',
  BodyUpdated: '本文を更新',
  FileAdded: 'ファイルを追加',
  FileRemoved: 'ファイルを削除',
  StatusChanged: 'ステータスを変更',
  AssigneeChanged: '担当者を変更',
  RelationAdded: '関連を追加',
  RelationRemoved: '関連を削除',
  ArchivedChanged: 'アーカイブ状態を変更',
  DraftChanged: '下書き状態を変更',
  CommitterChanged: 'コミッタを変更',
  PriorityChanged: '優先度を変更',
  DueDateChanged: '期限を変更',
};

/** 日付をグループ化するためのキーを取得 */
function getDateKey(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** 詳細データをパースして表示用テキストを生成 */
function formatDetails(actionType: ActivityActionType, details: string | null | undefined): string | null {
  if (!details) return null;

  try {
    const parsed = JSON.parse(details);

    switch (actionType) {
      case 'SubjectUpdated':
        return `「${parsed.old}」→「${parsed.new}」`;
      case 'AssigneeChanged':
      case 'CommitterChanged':
        return `${parsed.old ?? '未割当'} → ${parsed.new ?? '未割当'}`;
      case 'PriorityChanged':
      case 'StatusChanged':
        return `${parsed.old} → ${parsed.new}`;
      case 'ArchivedChanged':
        return parsed.new ? 'アーカイブしました' : 'アーカイブを解除しました';
      case 'DraftChanged':
        return parsed.new ? '下書きに変更しました' : '下書きを解除しました';
      case 'FileAdded':
        return `${parsed.fileName}`;
      case 'FileRemoved':
        return `${parsed.fileName}`;
      case 'RelationAdded':
        return `アイテム #${parsed.relatedItemId}`;
      case 'RelationRemoved':
        return `アイテム #${parsed.relatedItemId}`;
      case 'DueDateChanged': {
        const oldDate = parsed.old ? new Date(parsed.old).toLocaleDateString('ja-JP') : 'なし';
        const newDate = parsed.new ? new Date(parsed.new).toLocaleDateString('ja-JP') : 'なし';
        return `${oldDate} → ${newDate}`;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export default function ItemActivityTimeline({ workspaceId, itemId, isOpen, onClose }: ItemActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 初期化
  useEffect(() => {
    if (isOpen) {
      setActivities([]);
      setPage(1);
      setHasMore(true);
      setError(null);
    }
  }, [isOpen, itemId]);

  // データ取得
  const loadActivities = useCallback(async () => {
    if (!isOpen || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await fetchItemActivities(workspaceId, itemId, page);
      if (result.success && result.data) {
        const newActivities = result.data.data || [];
        setActivities((prev) => (page === 1 ? newActivities : [...prev, ...newActivities]));
        setHasMore(page < (result.data.totalPages || 1));
        setPage((prev) => prev + 1);
      } else {
        setError(result.message || 'アクティビティの取得に失敗しました。');
      }
    } catch {
      setError('アクティビティの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, isLoading, hasMore, page, workspaceId, itemId]);

  // 初回読み込み
  useEffect(() => {
    if (isOpen && activities.length === 0 && !isLoading && !error) {
      loadActivities();
    }
  }, [isOpen, activities.length, isLoading, error, loadActivities]);

  // 無限スクロール
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadActivities();
        }
      },
      { threshold: 0.1 },
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, isLoading, loadActivities]);

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
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} aria-hidden="true" />

      {/* モーダル */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h3 className="font-bold text-lg">タイムライン</h3>
            <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
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
              <div className="text-center text-base-content/50 py-8">アクティビティはありません</div>
            ) : (
              <div className="space-y-4">
                {groupedActivities.map((group, groupIndex) => {
                  const defaultConfig = { icon: 'icon-[mdi--circle]', badgeClass: 'badge-neutral' };

                  return (
                    <div key={group.date}>
                      {/* 日付ラベル */}
                      <div className={`text-sm text-base-content/70 mb-2 ${groupIndex > 0 ? 'mt-4' : ''}`}>
                        {group.date}
                      </div>

                      {/* アクティビティリスト */}
                      <div className="relative pl-6">
                        {/* 縦線 */}
                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-base-300" />

                        {group.items.map((activity) => {
                          const config =
                            activity.actionType && actionTypeConfig[activity.actionType]
                              ? actionTypeConfig[activity.actionType]
                              : defaultConfig;
                          const label =
                            activity.actionType && actionTypeLabels[activity.actionType]
                              ? actionTypeLabels[activity.actionType]
                              : '不明な操作';
                          const details = activity.actionType
                            ? formatDetails(activity.actionType, activity.details)
                            : null;
                          const time = activity.createdAt
                            ? new Date(activity.createdAt).toLocaleTimeString('ja-JP', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '';

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
                                    userName={activity.username}
                                    identityIconUrl={activity.identityIconUrl}
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
            <div ref={observerTarget} className="py-4 flex justify-center">
              {isLoading && <span className="loading loading-spinner loading-md" />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
