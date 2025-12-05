'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { fetchMyCommitterItems } from '@/actions/myCommitter';
import AppHeader from '@/components/common/AppHeader';
import DashboardSidebar from '@/components/common/DashboardSidebar';
import type {
  ItemWithTasksResponse,
  MyCommitterWorkspaceResponse,
  WorkspaceTaskDetailResponse,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';
import { getDisplayIconUrl } from '@/utils/imageUrl';

interface CommitterDashboardClientProps {
  initialUser?: UserInfo | null;
  initialWorkspaces: MyCommitterWorkspaceResponse[];
  fetchError?: string | null;
}

/**
 * 優先度のバッジを取得
 */
function getPriorityBadge(priority?: string | null) {
  if (!priority) return null;

  const badges: Record<string, { label: string; className: string }> = {
    Critical: { label: '緊急', className: 'badge-error' },
    High: { label: '高', className: 'badge-warning' },
    Medium: { label: '中', className: 'badge-info' },
    Low: { label: '低', className: 'badge-secondary' },
  };

  const badge = badges[priority];
  if (!badge) return null;

  return <span className={`badge badge-xs ${badge.className}`}>{badge.label}</span>;
}

/**
 * タスクタイプのアイコンパスを取得
 */
function getTaskTypeIconPath(task: WorkspaceTaskDetailResponse) {
  if (task.taskTypeIcon) {
    const iconName = task.taskTypeIcon.replace(/-/g, '').toLowerCase();
    return `/icons/task/${iconName}.svg`;
  }
  if (task.taskTypeCode) {
    const iconName = task.taskTypeCode.replace(/-/g, '').toLowerCase();
    return `/icons/task/${iconName}.svg`;
  }
  return null;
}

export default function CommitterDashboardClient({
  initialUser,
  initialWorkspaces,
  fetchError,
}: CommitterDashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);
  const notify = useNotify();

  // ワークスペース一覧
  const [workspaces] = useState<MyCommitterWorkspaceResponse[]>(initialWorkspaces);

  // 展開中のワークスペースID
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<number | null>(null);

  // ワークスペースごとのアイテムデータ
  const [itemsByWorkspace, setItemsByWorkspace] = useState<
    Record<number, { items: ItemWithTasksResponse[]; currentPage: number; totalPages: number; loading: boolean }>
  >({});

  // 展開中のアイテムID
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  // notify の最新値を参照するための ref
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // 初期エラー表示
  useEffect(() => {
    if (fetchError) {
      notify.error(fetchError);
    }
  }, [fetchError, notify]);

  // ワークスペース展開時にアイテムを取得
  const handleWorkspaceToggle = useCallback(
    async (workspaceId: number) => {
      if (expandedWorkspaceId === workspaceId) {
        // 閉じる
        setExpandedWorkspaceId(null);
        setExpandedItemId(null);
        return;
      }

      // 開く
      setExpandedWorkspaceId(workspaceId);
      setExpandedItemId(null);

      // 既にデータがある場合はスキップ
      if (itemsByWorkspace[workspaceId]?.items.length > 0) {
        return;
      }

      // ローディング開始
      setItemsByWorkspace((prev) => ({
        ...prev,
        [workspaceId]: { items: [], currentPage: 0, totalPages: 1, loading: true },
      }));

      try {
        const result = await fetchMyCommitterItems(workspaceId, 1);
        if (result.success) {
          setItemsByWorkspace((prev) => ({
            ...prev,
            [workspaceId]: {
              items: result.data.data || [],
              currentPage: result.data.currentPage || 1,
              totalPages: result.data.totalPages || 1,
              loading: false,
            },
          }));
        } else {
          notifyRef.current.error(result.message || 'アイテムの取得に失敗しました');
          setItemsByWorkspace((prev) => ({
            ...prev,
            [workspaceId]: { items: [], currentPage: 1, totalPages: 1, loading: false },
          }));
        }
      } catch (err) {
        console.error('Failed to fetch items:', err);
        notifyRef.current.error('サーバーとの通信でエラーが発生しました', true);
        setItemsByWorkspace((prev) => ({
          ...prev,
          [workspaceId]: { items: [], currentPage: 1, totalPages: 1, loading: false },
        }));
      }
    },
    [expandedWorkspaceId, itemsByWorkspace],
  );

  // アイテムの追加読み込み（無限スクロール）
  const loadMoreItems = useCallback(
    async (workspaceId: number) => {
      const wsData = itemsByWorkspace[workspaceId];
      if (!wsData || wsData.loading || wsData.currentPage >= wsData.totalPages) {
        return;
      }

      const nextPage = wsData.currentPage + 1;

      try {
        const result = await fetchMyCommitterItems(workspaceId, nextPage);
        if (result.success) {
          setItemsByWorkspace((prev) => ({
            ...prev,
            [workspaceId]: {
              items: [...(prev[workspaceId]?.items || []), ...(result.data.data || [])],
              currentPage: result.data.currentPage || nextPage,
              totalPages: result.data.totalPages || 1,
              loading: false,
            },
          }));
        } else {
          notifyRef.current.error(result.message || 'アイテムの取得に失敗しました');
        }
      } catch (err) {
        console.error('Failed to load more items:', err);
        notifyRef.current.error('サーバーとの通信でエラーが発生しました', true);
      }
    },
    [itemsByWorkspace],
  );

  // アイテム展開トグル
  const handleItemToggle = useCallback(
    (itemId: number) => {
      setExpandedItemId(expandedItemId === itemId ? null : itemId);
    },
    [expandedItemId],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader userInfo={userInfo} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <DashboardSidebar sidebarOpen={sidebarOpen} isAdmin={userInfo?.isAdmin ?? false} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="サイドバーを閉じる"
          />
        )}

        {/* Main Content */}
        <main id="scrollableDiv" className="flex-1 p-4 md:p-6 bg-base-100 overflow-auto h-[calc(100vh-4rem)]">
          {/* ページヘッダー */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <span className="icon-[mdi--account-check-outline] text-primary w-8 h-8" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-bold">コミッターダッシュボード</h1>
                <p className="text-base-content/70 mt-1">あなたがコミッターを担当するアイテムとタスクの一覧</p>
              </div>
            </div>
          </div>

          {/* ワークスペース一覧がない場合 */}
          {workspaces.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <span
                  className="icon-[mdi--clipboard-text-off-outline] w-16 h-16 text-base-content/30 mx-auto mb-4"
                  aria-hidden="true"
                />
                <p className="text-base-content/70">コミッターを担当しているアイテムがありません</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {workspaces.map((workspace) => {
                const isExpanded = expandedWorkspaceId === workspace.workspaceId;
                const wsData = itemsByWorkspace[workspace.workspaceId];

                return (
                  <div key={workspace.workspaceId} className="card bg-base-200">
                    {/* ワークスペースヘッダー（クリックで展開） */}
                    <button
                      type="button"
                      className="card-body p-4 cursor-pointer hover:bg-base-300 transition-colors rounded-t-2xl"
                      onClick={() => handleWorkspaceToggle(workspace.workspaceId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* ジャンルアイコン */}
                          {workspace.genreIcon && (
                            <img
                              src={`/icons/genres/${workspace.genreIcon}.svg`}
                              alt={workspace.genreName || 'ジャンル'}
                              className="w-8 h-8"
                            />
                          )}
                          <div>
                            <h2 className="text-lg font-bold">{workspace.workspaceName}</h2>
                            <p className="text-sm text-base-content/70">{workspace.genreName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* 統計バッジ */}
                          <div className="flex items-center gap-2">
                            <span className="badge badge-ghost">{workspace.itemCount} アイテム</span>
                            <span className="badge badge-primary">{workspace.activeTaskCount} タスク</span>
                            {workspace.overdueTaskCount > 0 && (
                              <span className="badge badge-error">{workspace.overdueTaskCount} 期限超過</span>
                            )}
                          </div>
                          {/* 展開アイコン */}
                          <span
                            className={`icon-[mdi--chevron-down] w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </button>

                    {/* アイテム一覧（展開時のみ表示） */}
                    {isExpanded && (
                      <div className="border-t border-base-300">
                        {wsData?.loading ? (
                          <div className="p-8 text-center">
                            <span className="loading loading-spinner loading-lg"></span>
                          </div>
                        ) : wsData?.items.length === 0 ? (
                          <div className="p-8 text-center text-base-content/70">アイテムがありません</div>
                        ) : (
                          <InfiniteScroll
                            dataLength={wsData?.items.length || 0}
                            next={() => loadMoreItems(workspace.workspaceId)}
                            hasMore={(wsData?.currentPage || 1) < (wsData?.totalPages || 1)}
                            loader={
                              <div className="text-center py-4">
                                <span className="loading loading-spinner loading-md"></span>
                              </div>
                            }
                            scrollableTarget="scrollableDiv"
                          >
                            <div className="p-4 space-y-3">
                              {wsData?.items.map((itemData, itemIndex) => {
                                const item = itemData.item;
                                const tasks = itemData.tasks || [];
                                // アイテムの一意識別子としてworkspaceId + codeを使用
                                const itemKey = `${item.workspaceId}-${item.code}`;
                                const isItemExpanded = expandedItemId === itemIndex;

                                return (
                                  <div key={itemKey} className="card bg-base-100">
                                    {/* アイテムヘッダー */}
                                    <button
                                      type="button"
                                      className="card-body p-3 cursor-pointer hover:bg-base-200 transition-colors rounded-t-2xl"
                                      onClick={() => handleItemToggle(itemIndex)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <span
                                            className="icon-[mdi--file-document-outline] w-5 h-5 text-base-content/50 flex-shrink-0"
                                            aria-hidden="true"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <Link
                                              href={`/workspaces/${item.workspaceCode}?itemCode=${item.code}`}
                                              className="font-medium hover:text-primary transition-colors truncate block"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              {item.subject}
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-base-content/50 mt-1">
                                              <span>{item.code}</span>
                                              {item.dueDate && (
                                                <>
                                                  <span>•</span>
                                                  <span>
                                                    期限:{' '}
                                                    {new Date(item.dueDate).toLocaleDateString('ja-JP', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                    })}
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <span className="badge badge-ghost badge-sm">{tasks.length} タスク</span>
                                          <span
                                            className={`icon-[mdi--chevron-down] w-5 h-5 transition-transform ${isItemExpanded ? 'rotate-180' : ''}`}
                                            aria-hidden="true"
                                          />
                                        </div>
                                      </div>
                                    </button>

                                    {/* タスク一覧（展開時のみ表示） */}
                                    {isItemExpanded && tasks.length > 0 && (
                                      <div className="border-t border-base-300 p-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                          {tasks.map((task) => {
                                            const isInactive = task.isCompleted || task.isDiscarded;
                                            const iconPath = getTaskTypeIconPath(task);

                                            return (
                                              <div
                                                key={task.id}
                                                className={`card bg-base-200 ${isInactive ? 'opacity-60' : ''}`}
                                              >
                                                <div className="p-3 flex flex-col gap-2">
                                                  {/* ステータスバッジ */}
                                                  <div className="flex items-start justify-between gap-2">
                                                    {iconPath && (
                                                      <img
                                                        src={iconPath}
                                                        alt={task.taskTypeName || 'タスクタイプ'}
                                                        className="w-6 h-6 rounded flex-shrink-0"
                                                        title={task.taskTypeName || undefined}
                                                      />
                                                    )}
                                                    <div className="flex flex-wrap gap-1 justify-end">
                                                      {task.isCompleted && (
                                                        <span className="badge badge-success badge-xs">完了</span>
                                                      )}
                                                      {task.isDiscarded && (
                                                        <span className="badge badge-neutral badge-xs">破棄</span>
                                                      )}
                                                      {getPriorityBadge(task.priority)}
                                                    </div>
                                                  </div>

                                                  {/* タスク内容 */}
                                                  <p className="text-sm line-clamp-2" title={task.content || undefined}>
                                                    {task.content}
                                                  </p>

                                                  {/* 進捗バー */}
                                                  <progress
                                                    className="progress progress-primary w-full h-1.5"
                                                    value={task.progressPercentage || 0}
                                                    max="100"
                                                  ></progress>

                                                  {/* 担当者・期限 */}
                                                  <div className="flex items-center justify-between text-xs text-base-content/70">
                                                    <div className="flex items-center gap-1">
                                                      {task.assignedUserId && task.assignedAvatarUrl && (
                                                        <img
                                                          src={getDisplayIconUrl(task.assignedAvatarUrl)}
                                                          alt={task.assignedUsername || '担当者'}
                                                          className="w-4 h-4 rounded-full object-cover"
                                                        />
                                                      )}
                                                      <span className="truncate max-w-[80px]">
                                                        {task.assignedUsername || '—'}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <span
                                                        className="icon-[mdi--calendar-outline] w-3.5 h-3.5"
                                                        aria-hidden="true"
                                                      />
                                                      <span>
                                                        {task.dueDate
                                                          ? new Date(task.dueDate).toLocaleDateString('ja-JP', {
                                                              month: 'short',
                                                              day: 'numeric',
                                                            })
                                                          : '—'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* タスクがない場合 */}
                                    {isItemExpanded && tasks.length === 0 && (
                                      <div className="border-t border-base-300 p-4 text-center text-base-content/50 text-sm">
                                        タスクはありません
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </InfiniteScroll>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
