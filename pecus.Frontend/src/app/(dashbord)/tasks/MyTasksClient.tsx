'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { fetchMyTasks } from '@/actions/myTask';
import AppHeader from '@/components/common/AppHeader';
import DashboardSidebar from '@/components/common/DashboardSidebar';
import TaskStatusFilter, { type TaskStatus } from '@/components/common/TaskStatusFilter';
import type {
  MyTaskDetailResponse,
  MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse,
  TaskStatusFilter as TaskStatusFilterType,
  WorkspaceTaskStatistics,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';
import { getDisplayIconUrl } from '@/utils/imageUrl';

interface MyTasksClientProps {
  initialUser?: UserInfo | null;
  initialData?: MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse | null;
  fetchError?: string | null;
}

/**
 * フロントエンドの TaskStatus を API の TaskStatusFilter に変換
 */
function toApiTaskStatusFilter(status: TaskStatus): TaskStatusFilterType {
  switch (status) {
    case 'active':
      return 'Active';
    case 'completed':
      return 'Completed';
    case 'discarded':
      return 'Discarded';
    default:
      return 'All';
  }
}

/**
 * 優先度のバッジを取得
 */
function getPriorityBadge(priority?: string) {
  if (!priority) return null;

  const badges = {
    Critical: { label: '緊急', className: 'badge-error' },
    High: { label: '高', className: 'badge-warning' },
    Medium: { label: '中', className: 'badge-info' },
    Low: { label: '低', className: 'badge-secondary' },
  };

  const badge = badges[priority as keyof typeof badges];
  if (!badge) return null;

  return <span className={`badge badge-xs ${badge.className}`}>{badge.label}</span>;
}

/**
 * タスクタイプのアイコンパスを取得
 */
function getTaskTypeIconPath(task: MyTaskDetailResponse) {
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

export default function MyTasksClient({ initialUser, initialData, fetchError }: MyTasksClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo] = useState<UserInfo | null>(initialUser || null);
  const notify = useNotify();

  // タスク一覧の状態
  const [tasks, setTasks] = useState<MyTaskDetailResponse[]>(initialData?.data || []);
  const [currentPage, setCurrentPage] = useState(initialData?.currentPage || 1);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
  const [statistics, setStatistics] = useState<WorkspaceTaskStatistics | null>(initialData?.summary || null);

  // フィルター状態（初期値: アクティブのみ）
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('active');

  // notify の最新値を参照するための ref
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // 次のページを読み込む（無限スクロール用）
  const loadMoreItems = useCallback(async () => {
    try {
      const nextPage = currentPage + 1;
      const result = await fetchMyTasks(nextPage, toApiTaskStatusFilter(taskStatus));

      if (result.success) {
        setTasks((prev) => [...prev, ...(result.data.data || [])]);
        setCurrentPage(result.data.currentPage || nextPage);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
        setStatistics(result.data.summary || null);
      } else {
        notifyRef.current.error(result.message || 'タスクの取得に失敗しました。');
      }
    } catch (err) {
      console.error('Failed to load more tasks:', err);
      notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
    }
  }, [currentPage, taskStatus]);

  // フィルター変更ハンドラー（リストをリセットして1ページ目から取得）
  const handleStatusChange = useCallback(async (status: TaskStatus) => {
    setTaskStatus(status);
    try {
      const result = await fetchMyTasks(1, toApiTaskStatusFilter(status));

      if (result.success) {
        setTasks(result.data.data || []);
        setCurrentPage(result.data.currentPage || 1);
        setTotalPages(result.data.totalPages || 1);
        setTotalCount(result.data.totalCount || 0);
        setStatistics(result.data.summary || null);
      } else {
        notifyRef.current.error(result.message || 'タスクの取得に失敗しました。');
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      notifyRef.current.error('サーバーとの通信でエラーが発生しました。', true);
    }
  }, []);

  // 初期エラー表示
  useEffect(() => {
    if (fetchError) {
      notify.error(fetchError);
    }
  }, [fetchError, notify]);

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
              <span className="icon-[mdi--clipboard-check-outline] text-primary w-8 h-8" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-bold">マイタスク</h1>
                <p className="text-base-content/70 mt-1">あなたに割り当てられたタスクの一覧</p>
              </div>
            </div>
          </div>

          {/* 統計サマリー */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="stat bg-base-200 rounded-box p-4">
                <div className="stat-title">合計</div>
                <div className="stat-value text-2xl">{statistics.totalCount}</div>
              </div>
              <div className="stat bg-base-200 rounded-box p-4">
                <div className="stat-title">アクティブ</div>
                <div className="stat-value text-2xl text-primary">{statistics.incompleteCount}</div>
              </div>
              <div className="stat bg-base-200 rounded-box p-4">
                <div className="stat-title">完了</div>
                <div className="stat-value text-2xl text-success">{statistics.completedCount}</div>
              </div>
              <div className="stat bg-base-200 rounded-box p-4">
                <div className="stat-title">破棄</div>
                <div className="stat-value text-2xl text-base-content/50">{statistics.discardedCount}</div>
              </div>
            </div>
          )}

          {/* フィルターエリア */}
          <div className="card mb-6">
            <div className="card-body p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* ステータスフィルター */}
                <TaskStatusFilter value={taskStatus} onChange={handleStatusChange} size="sm" />

                {/* 件数表示 */}
                <div className="flex items-center gap-2">
                  <span className="badge badge-primary">{totalCount} 件</span>
                </div>
              </div>
            </div>
          </div>

          {/* タスク一覧 */}
          <div className="card">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-lg">タスク一覧</h2>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <span className="icon-[mdi--clipboard-check-outline] w-16 h-16 text-base-content/30 mb-4" />
                  <p className="text-base-content/70">該当するタスクがありません</p>
                </div>
              ) : (
                <InfiniteScroll
                  dataLength={tasks.length}
                  next={loadMoreItems}
                  hasMore={totalPages > 1 && currentPage < totalPages}
                  loader={
                    <div className="text-center py-4">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  }
                  endMessage={
                    <div className="text-center py-4">
                      <p className="text-base-content/70">すべてのタスクを表示しました</p>
                    </div>
                  }
                  scrollableTarget="scrollableDiv"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tasks.map((task) => {
                      const isInactive = task.isCompleted || task.isDiscarded;
                      const iconPath = getTaskTypeIconPath(task);

                      return (
                        <div
                          key={task.id}
                          className={`card bg-base-200 hover:shadow-lg transition-shadow flex flex-col h-full ${
                            isInactive ? 'opacity-60 hover:opacity-100' : ''
                          }`}
                        >
                          {/* カードボディ: 伸縮する部分 */}
                          <div className="p-3 pb-2 gap-2 flex flex-col flex-1">
                            {/* ヘッダー: ワークスペース + ステータス */}
                            <div className="flex items-start justify-between gap-2">
                              {/* ワークスペース名 */}
                              <Link
                                href={`/workspaces/${task.workspaceCode}?itemCode=${task.itemCode}`}
                                className="badge badge-soft badge-accent badge-sm truncate hover:badge-primary transition-colors"
                              >
                                {task.workspaceName}
                              </Link>
                              {/* ステータスバッジ */}
                              <div className="flex flex-wrap gap-1 justify-end">
                                {task.isCompleted && <span className="badge badge-success badge-xs">完了</span>}
                                {task.isDiscarded && <span className="badge badge-neutral badge-xs">破棄</span>}
                                {getPriorityBadge(task.priority)}
                              </div>
                            </div>

                            {/* アイテム情報 */}
                            <div className="flex items-center gap-2 text-xs text-base-content/70">
                              <span className="icon-[mdi--file-document-outline] w-3.5 h-3.5" aria-hidden="true" />
                              <Link
                                href={`/workspaces/${task.workspaceCode}?itemCode=${task.itemCode}`}
                                className="truncate hover:text-primary transition-colors"
                                title={task.itemSubject || undefined}
                              >
                                {task.itemSubject}
                              </Link>
                            </div>

                            {/* タスクタイプアイコン + タスク内容 */}
                            <div className="flex items-start gap-2 flex-1">
                              {iconPath && (
                                <img
                                  src={iconPath}
                                  alt={task.taskTypeName || 'タスクタイプ'}
                                  className="w-6 h-6 rounded flex-shrink-0 mt-0.5"
                                  title={task.taskTypeName || undefined}
                                />
                              )}
                              <p className="text-sm line-clamp-2 flex-1" title={task.content || undefined}>
                                {task.content}
                              </p>
                            </div>
                          </div>

                          {/* カードフッター: 固定位置 */}
                          <div className="p-3 pt-0">
                            {/* 進捗バー */}
                            <div className="w-full mb-2">
                              <progress
                                className="progress progress-primary w-full h-1.5"
                                value={task.progressPercentage || 0}
                                max="100"
                              ></progress>
                            </div>

                            {/* 担当者 + 期限 */}
                            <div className="border-t border-base-300 pt-1.5">
                              {/* 担当者（自分） */}
                              <div className="flex items-center gap-1.5 h-5">
                                {task.assignedUserId ? (
                                  <>
                                    {task.assignedAvatarUrl && (
                                      <img
                                        src={getDisplayIconUrl(task.assignedAvatarUrl)}
                                        alt={task.assignedUsername || '担当者'}
                                        className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                      />
                                    )}
                                    <span className="text-xs truncate">{task.assignedUsername}</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-base-content/30">—</span>
                                )}
                              </div>
                              {/* 期限 */}
                              <div className="flex items-center gap-1 text-xs text-base-content/70 h-5 mt-1">
                                <span className="icon-[mdi--calendar-outline] w-3.5 h-3.5" aria-hidden="true" />
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

                            {/* コメント数 */}
                            {(task.commentCount ?? 0) > 0 && (
                              <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-base-300">
                                <span className="icon-[mdi--message-outline] w-4 h-4 text-base-content/50" />
                                <span className="text-xs text-base-content/50">{task.commentCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </InfiniteScroll>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
