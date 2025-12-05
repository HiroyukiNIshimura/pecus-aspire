'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type { TasksByDueDateResponse, TaskWithItemResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { getDisplayIconUrl } from '@/utils/imageUrl';
import TaskEditModal from './TaskEditModal';

// ワークスペース情報の共通型（タスク用とコミッター用で共通の項目）
export interface WorkspaceInfo {
  workspaceId: number;
  workspaceCode: string | null;
  workspaceName: string | null;
  genreIcon?: string | null;
  genreName?: string | null;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  oldestDueDate?: string | null;
  // コミッター用の追加項目（オプショナル）
  itemCount?: number;
}

interface WorkspaceTaskAccordionProps {
  /** ワークスペース一覧 */
  workspaces: WorkspaceInfo[];
  /** タスクを取得する関数（ワークスペースID -> 期限日グループ化されたタスク） */
  fetchTasks: (workspaceId: number) => Promise<{ success: boolean; data?: TasksByDueDateResponse[]; message?: string }>;
  /** 空状態のメッセージ */
  emptyMessage?: string;
  /** 空状態のアイコンクラス */
  emptyIconClass?: string;
  /** コミッター向け表示か（アイテム数を表示） */
  showItemCount?: boolean;
  /** タスクタイプマスタデータ（編集モーダル用）- 省略時は編集不可 */
  taskTypes?: TaskTypeOption[];
  /** 現在ログイン中のユーザー - 省略時は編集不可 */
  currentUser?: {
    id: number;
    username: string;
    email: string;
    identityIconUrl: string | null;
  } | null;
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
function getTaskTypeIconPath(task: TaskWithItemResponse) {
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

/**
 * 期限日の表示ラベルを取得
 */
function getDueDateLabel(dueDateStr: string): { label: string; isOverdue: boolean; isDueToday: boolean } {
  const dueDate = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}日超過`,
      isOverdue: true,
      isDueToday: false,
    };
  }
  if (diffDays === 0) {
    return {
      label: '本日期限',
      isOverdue: false,
      isDueToday: true,
    };
  }
  if (diffDays === 1) {
    return {
      label: '明日期限',
      isOverdue: false,
      isDueToday: false,
    };
  }
  return {
    label: dueDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }),
    isOverdue: false,
    isDueToday: false,
  };
}

/**
 * ワークスペース×期限日でタスクを表示するアコーディオンコンポーネント
 */
export default function WorkspaceTaskAccordion({
  workspaces,
  fetchTasks,
  emptyMessage = 'ワークスペースがありません',
  emptyIconClass = 'icon-[mdi--clipboard-text-off-outline]',
  showItemCount = false,
  taskTypes,
  currentUser,
}: WorkspaceTaskAccordionProps) {
  const notify = useNotify();
  const notifyRef = useRef(notify);

  // 展開中のワークスペースID
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<number | null>(null);

  // ワークスペースごとのタスクデータ
  const [tasksByWorkspace, setTasksByWorkspace] = useState<
    Record<number, { dueDateGroups: TasksByDueDateResponse[]; loading: boolean; loaded: boolean }>
  >({});

  // 展開中の期限日グループ
  const [expandedDueDates, setExpandedDueDates] = useState<Set<string>>(new Set());

  // タスク編集モーダル状態
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithItemResponse | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // ワークスペース展開時にタスクを取得
  const handleWorkspaceToggle = useCallback(
    async (workspaceId: number) => {
      if (expandedWorkspaceId === workspaceId) {
        // 閉じる
        setExpandedWorkspaceId(null);
        setExpandedDueDates(new Set());
        return;
      }

      // 開く
      setExpandedWorkspaceId(workspaceId);
      setExpandedDueDates(new Set());

      // 既にデータがある場合はスキップ
      if (tasksByWorkspace[workspaceId]?.loaded) {
        return;
      }

      // ローディング開始
      setTasksByWorkspace((prev) => ({
        ...prev,
        [workspaceId]: { dueDateGroups: [], loading: true, loaded: false },
      }));

      try {
        const result = await fetchTasks(workspaceId);
        if (result.success && result.data) {
          setTasksByWorkspace((prev) => ({
            ...prev,
            [workspaceId]: { dueDateGroups: result.data || [], loading: false, loaded: true },
          }));
        } else {
          notifyRef.current.error(result.message || 'タスクの取得に失敗しました');
          setTasksByWorkspace((prev) => ({
            ...prev,
            [workspaceId]: { dueDateGroups: [], loading: false, loaded: true },
          }));
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        notifyRef.current.error('サーバーとの通信でエラーが発生しました', true);
        setTasksByWorkspace((prev) => ({
          ...prev,
          [workspaceId]: { dueDateGroups: [], loading: false, loaded: true },
        }));
      }
    },
    [expandedWorkspaceId, tasksByWorkspace, fetchTasks],
  );

  // 期限日グループの展開トグル
  const handleDueDateToggle = useCallback((dueDate: string) => {
    setExpandedDueDates((prev) => {
      const next = new Set(prev);
      if (next.has(dueDate)) {
        next.delete(dueDate);
      } else {
        next.add(dueDate);
      }
      return next;
    });
  }, []);

  // タスク編集モーダルを開く
  const handleOpenTaskEditModal = useCallback((task: TaskWithItemResponse, workspaceId: number) => {
    setEditingTask(task);
    setEditingWorkspaceId(workspaceId);
    setEditModalOpen(true);
  }, []);

  // タスク編集モーダルを閉じる
  const handleCloseTaskEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingTask(null);
    setEditingWorkspaceId(null);
  }, []);

  // タスク編集成功時の処理
  const handleTaskEditSuccess = useCallback(() => {
    // 該当ワークスペースのタスクを再取得
    if (editingWorkspaceId) {
      const workspaceId = editingWorkspaceId;
      setTasksByWorkspace((prev) => ({
        ...prev,
        [workspaceId]: { ...prev[workspaceId], loading: true },
      }));
      fetchTasks(workspaceId).then((result) => {
        if (result.success && result.data) {
          setTasksByWorkspace((prev) => ({
            ...prev,
            [workspaceId]: { dueDateGroups: result.data || [], loading: false, loaded: true },
          }));
        }
      });
    }
    handleCloseTaskEditModal();
  }, [editingWorkspaceId, fetchTasks, handleCloseTaskEditModal]);

  // ワークスペースが空の場合
  if (workspaces.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <span className={`${emptyIconClass} w-16 h-16 text-base-content/30 mx-auto mb-4`} aria-hidden="true" />
          <p className="text-base-content/70">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workspaces.map((workspace) => {
        const isExpanded = expandedWorkspaceId === workspace.workspaceId;
        const wsData = tasksByWorkspace[workspace.workspaceId];

        return (
          <div key={workspace.workspaceId} className="card bg-base-200">
            {/* ワークスペースヘッダー（クリックで展開） */}
            <button
              type="button"
              className="card-body p-3 sm:p-4 cursor-pointer hover:bg-base-300 transition-colors rounded-t-2xl w-full text-left"
              onClick={() => handleWorkspaceToggle(workspace.workspaceId)}
            >
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {/* ジャンルアイコン */}
                  {workspace.genreIcon && (
                    <img
                      src={`/icons/genres/${workspace.genreIcon}.svg`}
                      alt={workspace.genreName || 'ジャンル'}
                      className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold truncate">
                      {workspace.workspaceName || '(名称未設定)'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-base-content/70">
                      {workspace.genreName && (
                        <span className="truncate max-w-[80px] sm:max-w-none">{workspace.genreName}</span>
                      )}
                      {workspace.oldestDueDate && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <span className="icon-[mdi--calendar-alert] w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                            <span className="hidden sm:inline">最古期限:</span>
                            {new Date(workspace.oldestDueDate).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  {/* 統計バッジ */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2">
                    {showItemCount && workspace.itemCount !== undefined && (
                      <span className="badge badge-ghost badge-sm sm:badge-md whitespace-nowrap text-center min-w-[4.5rem] sm:min-w-0">
                        {workspace.itemCount} アイテム
                      </span>
                    )}
                    <span className="badge badge-primary badge-sm sm:badge-md whitespace-nowrap text-center min-w-[4.5rem] sm:min-w-0">
                      {workspace.activeTaskCount} タスク
                    </span>
                    {workspace.overdueTaskCount > 0 && (
                      <span className="badge badge-error badge-sm sm:badge-md whitespace-nowrap text-center min-w-[4.5rem] sm:min-w-0">
                        {workspace.overdueTaskCount} 超過
                      </span>
                    )}
                  </div>
                  {/* 展開アイコン */}
                  <span
                    className={`icon-[mdi--chevron-down] w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </button>

            {/* タスク一覧（展開時のみ表示） */}
            {isExpanded && (
              <div className="border-t border-base-300">
                {wsData?.loading ? (
                  <div className="p-8 text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                ) : wsData?.dueDateGroups.length === 0 ? (
                  <div className="p-8 text-center text-base-content/70">タスクがありません</div>
                ) : (
                  <div className="p-4 space-y-3">
                    {wsData?.dueDateGroups.map((dueDateGroup) => {
                      const dueDateKey = dueDateGroup.dueDate || 'no-date';
                      const isDueDateExpanded = expandedDueDates.has(dueDateKey);
                      const dateInfo = dueDateGroup.dueDate
                        ? getDueDateLabel(dueDateGroup.dueDate)
                        : { label: '期限未設定', isOverdue: false, isDueToday: false };

                      return (
                        <div key={dueDateKey} className="card bg-base-100">
                          {/* 期限日ヘッダー */}
                          <button
                            type="button"
                            className="card-body p-3 cursor-pointer hover:bg-base-200 transition-colors rounded-t-2xl w-full text-left"
                            onClick={() => handleDueDateToggle(dueDateKey)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`icon-[mdi--calendar] w-5 h-5 ${
                                    dateInfo.isOverdue
                                      ? 'text-error'
                                      : dateInfo.isDueToday
                                        ? 'text-warning'
                                        : 'text-base-content/50'
                                  }`}
                                  aria-hidden="true"
                                />
                                <span
                                  className={`font-medium ${
                                    dateInfo.isOverdue ? 'text-error' : dateInfo.isDueToday ? 'text-warning' : ''
                                  }`}
                                >
                                  {dateInfo.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="badge badge-ghost badge-sm">
                                  {dueDateGroup.tasks?.length || 0} タスク
                                </span>
                                <span
                                  className={`icon-[mdi--chevron-down] w-5 h-5 transition-transform ${isDueDateExpanded ? 'rotate-180' : ''}`}
                                  aria-hidden="true"
                                />
                              </div>
                            </div>
                          </button>

                          {/* タスク一覧（期限日グループ展開時） */}
                          {isDueDateExpanded && dueDateGroup.tasks && dueDateGroup.tasks.length > 0 && (
                            <div className="border-t border-base-300 p-2">
                              <div className="space-y-1">
                                {dueDateGroup.tasks.map((task) => {
                                  const isInactive = task.isCompleted || task.isDiscarded;
                                  const iconPath = getTaskTypeIconPath(task);

                                  return (
                                    <div
                                      key={task.taskId}
                                      className={`flex items-center gap-2 p-2 rounded-lg bg-base-200 hover:bg-base-300 transition-colors ${isInactive ? 'opacity-60' : ''}`}
                                    >
                                      {/* タスクタイプアイコン */}
                                      {iconPath && (
                                        <img
                                          src={iconPath}
                                          alt={task.taskTypeName || 'タスクタイプ'}
                                          className="w-5 h-5 rounded flex-shrink-0"
                                          title={task.taskTypeName || undefined}
                                        />
                                      )}

                                      {/* タスク内容 + アイテム名（リンク） */}
                                      <Link
                                        href={`/workspaces/${task.workspaceCode}?itemCode=${task.itemCode}`}
                                        className="flex-1 min-w-0 hover:text-primary transition-colors"
                                      >
                                        <p className="text-sm truncate" title={task.taskContent || undefined}>
                                          {task.taskContent}
                                        </p>
                                        <p
                                          className="text-xs text-base-content/50 truncate"
                                          title={task.itemSubject || undefined}
                                        >
                                          {task.itemSubject}
                                        </p>
                                      </Link>

                                      {/* 進捗バー（コンパクト） */}
                                      <div className="w-16 flex-shrink-0 hidden sm:block">
                                        <progress
                                          className="progress progress-primary w-full h-1"
                                          value={task.progressPercentage || 0}
                                          max="100"
                                        ></progress>
                                      </div>

                                      {/* 担当者アバター */}
                                      {task.assignedUserId && task.assignedAvatarUrl ? (
                                        <img
                                          src={getDisplayIconUrl(task.assignedAvatarUrl)}
                                          alt={task.assignedUsername || '担当者'}
                                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                          title={task.assignedUsername || undefined}
                                        />
                                      ) : (
                                        <span className="w-5 h-5 flex-shrink-0 hidden sm:block" />
                                      )}

                                      {/* ステータスバッジ */}
                                      <div className="flex gap-1 flex-shrink-0">
                                        {task.isCompleted && <span className="badge badge-success badge-xs">完了</span>}
                                        {task.isDiscarded && <span className="badge badge-neutral badge-xs">破棄</span>}
                                        {!task.isCompleted && !task.isDiscarded && getPriorityBadge(task.priority)}
                                      </div>

                                      {/* 編集ボタン */}
                                      {taskTypes ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenTaskEditModal(task, workspace.workspaceId)}
                                          className="btn btn-ghost btn-xs btn-square flex-shrink-0"
                                          title="タスクを編集"
                                        >
                                          <span className="icon-[mdi--pencil] w-4 h-4" aria-hidden="true" />
                                        </button>
                                      ) : (
                                        <Link
                                          href={`/workspaces/${task.workspaceCode}?itemCode=${task.itemCode}`}
                                          className="btn btn-ghost btn-xs btn-square flex-shrink-0"
                                          title="タスク詳細"
                                        >
                                          <span className="icon-[mdi--open-in-new] w-4 h-4" aria-hidden="true" />
                                        </Link>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* タスク編集モーダル */}
      {taskTypes && editingTask && editingWorkspaceId && (
        <TaskEditModal
          isOpen={editModalOpen}
          onClose={handleCloseTaskEditModal}
          onSuccess={handleTaskEditSuccess}
          workspaceId={editingWorkspaceId}
          itemId={editingTask.itemId}
          taskId={editingTask.taskId}
          taskTypes={taskTypes}
          currentUser={currentUser}
          itemCommitterId={editingTask.itemCommitterId}
          itemCommitterName={editingTask.itemCommitterUsername}
          itemCommitterAvatarUrl={editingTask.itemCommitterAvatarUrl}
        />
      )}
    </div>
  );
}
