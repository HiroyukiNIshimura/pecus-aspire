'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import WorkspaceTaskDetailPage from '@/app/(workspace-full)/workspaces/[code]/WorkspaceTaskDetailPage';
import { EmptyStateCard } from '@/components/common/feedback/EmptyState';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import { uiConfig } from '@/config/ui';
import type { TasksByDueDateResponse, TaskWithItemResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { formatDate, formatShortDateJa } from '@/libs/utils/date';

type CommentTypeCounts = {
  HelpWanted?: number;
  Urge?: number;
};

const getCommentTypeCounts = (task: TaskWithItemResponse): CommentTypeCounts => {
  const raw = (task as unknown as { commentTypeCounts?: CommentTypeCounts }).commentTypeCounts;
  return raw ?? {};
};

// ワークスペース情報の共通型（タスク用とコミッター用で共通の項目）
export interface WorkspaceInfo {
  /** リスト内での一意なインデックス（React key用） */
  listIndex: number;
  workspaceId: number;
  workspaceCode: string | null;
  workspaceName: string | null;
  genreIcon?: string | null;
  genreName?: string | null;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  oldestDueDate?: string | null;
  helpCommentCount: number;
  reminderCommentCount: number;
  // コミッター用の追加項目（オプショナル）
  itemCount?: number;
  /** フィルタに応じた表示用タスク数（設定されていれば優先） */
  displayTaskCount?: number;
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
  /** 表示モード: 'assigned' = 担当者のみ表示, 'committer' = コミッターのみ表示, 'both' = 両方表示（デフォルト） */
  displayMode?: 'assigned' | 'committer' | 'both';
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
    label: formatDate(dueDate, 'yyyy年M月d日'),
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
  displayMode = 'both',
}: WorkspaceTaskAccordionProps) {
  const notify = useNotify();
  const notifyRef = useRef(notify);

  // 展開中のワークスペースID（複数同時展開を許可してスクロールジャンプを防ぐ）
  const [expandedWorkspaceIds, setExpandedWorkspaceIds] = useState<Set<number>>(new Set());

  // ワークスペースごとのタスクデータ
  const [tasksByWorkspace, setTasksByWorkspace] = useState<
    Record<number, { dueDateGroups: TasksByDueDateResponse[]; loading: boolean; loaded: boolean }>
  >({});

  // 展開中の期限日グループ（workspaceId + dueDateKey で一意にする）
  const [expandedDueDates, setExpandedDueDates] = useState<Set<string>>(new Set());

  // タスク編集モーダル状態
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithItemResponse | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  // fetchTasksをrefで保持して最新の関数を参照
  const fetchTasksRef = useRef(fetchTasks);
  useEffect(() => {
    fetchTasksRef.current = fetchTasks;
  }, [fetchTasks]);

  // タスクを取得する関数
  const loadTasks = useCallback(async (workspaceId: number) => {
    // ローディング開始
    setTasksByWorkspace((prev) => ({
      ...prev,
      [workspaceId]: { dueDateGroups: [], loading: true, loaded: false },
    }));

    try {
      const result = await fetchTasksRef.current(workspaceId);
      if (result.success && result.data) {
        const dueDateGroups = result.data || [];

        setTasksByWorkspace((prev) => ({
          ...prev,
          [workspaceId]: { dueDateGroups, loading: false, loaded: true },
        }));

        // 上位N件の期限日グループを自動展開
        if (uiConfig.autoExpandDueDateThreshold > 0) {
          setExpandedDueDates((prev) => {
            const next = new Set(prev);
            for (const g of dueDateGroups.slice(0, uiConfig.autoExpandDueDateThreshold)) {
              const key = `${workspaceId}__${g.dueDate || 'no-date'}`;
              next.add(key);
            }
            return next;
          });
        }
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
  }, []);

  // ワークスペース展開時にタスクを取得
  const handleWorkspaceToggle = useCallback(
    (workspaceId: number) => {
      // 現在の展開状態を確認
      const isCurrentlyExpanded = expandedWorkspaceIds.has(workspaceId);

      if (isCurrentlyExpanded) {
        // 閉じる
        setExpandedWorkspaceIds((prev) => {
          const next = new Set(prev);
          next.delete(workspaceId);
          return next;
        });
        // 期限日展開状態もクリア
        setExpandedDueDates((prevDates) => {
          const nextDates = new Set(prevDates);
          [...nextDates].forEach((key) => {
            if (key.startsWith(`${workspaceId}__`)) {
              nextDates.delete(key);
            }
          });
          return nextDates;
        });
      } else {
        // 開く
        setExpandedWorkspaceIds((prev) => {
          const next = new Set(prev);
          next.add(workspaceId);
          return next;
        });

        // データがなければ取得
        const wsData = tasksByWorkspace[workspaceId];
        if (!wsData?.loaded && !wsData?.loading) {
          loadTasks(workspaceId);
        }
      }
    },
    [expandedWorkspaceIds, tasksByWorkspace, loadTasks],
  );

  // 期限日グループの展開トグル
  const handleDueDateToggle = useCallback((workspaceId: number, dueDate: string) => {
    const key = `${workspaceId}__${dueDate}`;
    setExpandedDueDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleDueDateExpandAll = useCallback(
    (workspaceId: number, groups: TasksByDueDateResponse[] | undefined, expand: boolean) => {
      if (!groups) return;
      setExpandedDueDates((prev) => {
        const next = new Set(prev);
        groups.forEach((g) => {
          const key = `${workspaceId}__${g.dueDate || 'no-date'}`;
          if (expand) {
            next.add(key);
          } else {
            next.delete(key);
          }
        });
        return next;
      });
    },
    [],
  );

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

  // タスク編集成功時の処理（モーダルは閉じずにデータのみ更新）
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
    // モーダルは閉じない（ユーザーが明示的に閉じるまで開いたまま）
  }, [editingWorkspaceId, fetchTasks]);

  // ワークスペースが空の場合
  if (workspaces.length === 0) {
    return (
      <div className="card">
        <EmptyStateCard
          iconClass={emptyIconClass}
          message={emptyMessage}
          size="sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workspaces.map((workspace) => {
        const isExpanded = expandedWorkspaceIds.has(workspace.workspaceId);
        const wsData = tasksByWorkspace[workspace.workspaceId];
        // ロード完了後のみ取得したタスク数を表示、それ以外はpropsの値を使用
        const displayedTaskCount = wsData?.loaded
          ? wsData.dueDateGroups.reduce((sum, group) => sum + (group.tasks?.length || 0), 0)
          : (workspace.displayTaskCount ?? workspace.activeTaskCount);
        const allDueKeys =
          wsData?.dueDateGroups?.map((g) => `${workspace.workspaceId}__${g.dueDate || 'no-date'}`) || [];
        const allExpanded = allDueKeys.length > 0 && allDueKeys.every((k) => expandedDueDates.has(k));

        return (
          <div key={workspace.listIndex} className="card bg-base-200">
            {/* ワークスペースヘッダー */}
            <div className="card-body p-3 sm:p-4 hover:bg-base-300 transition-colors rounded-t-2xl">
              <div className="flex items-start sm:items-center justify-between gap-2">
                {/* クリック可能なメイン部分 */}
                <button
                  type="button"
                  className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  onClick={() => handleWorkspaceToggle(workspace.workspaceId)}
                >
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
                        <span className="truncate max-w-20 sm:max-w-none">{workspace.genreName}</span>
                      )}
                      {workspace.oldestDueDate && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <span className="icon-[mdi--calendar-alert] w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                            <span className="hidden sm:inline">最古期限:</span>
                            {formatShortDateJa(workspace.oldestDueDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {/* 展開アイコン */}
                  <span
                    className={`icon-[mdi--chevron-down] w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  {/* 統計バッジ */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2">
                    {showItemCount && workspace.itemCount !== undefined && (
                      <span className="badge badge-secondary badge-sm sm:badge-md whitespace-nowrap text-center min-w-18 sm:min-w-0">
                        {workspace.itemCount} アイテム
                      </span>
                    )}
                    <span className="badge badge-primary badge-sm sm:badge-md whitespace-nowrap text-center min-w-18 sm:min-w-0">
                      {displayedTaskCount} タスク
                    </span>
                    {workspace.overdueTaskCount > 0 && (
                      <span className="badge badge-error badge-sm sm:badge-md whitespace-nowrap text-center min-w-18 sm:min-w-0">
                        {workspace.overdueTaskCount} 超過
                      </span>
                    )}
                  </div>
                  {/* 期限グループ一括展開 */}
                  {isExpanded && wsData?.dueDateGroups?.length ? (
                    <button
                      type="button"
                      onClick={() => handleDueDateExpandAll(workspace.workspaceId, wsData.dueDateGroups, !allExpanded)}
                      className="btn btn-soft btn-secondary btn-xs"
                      title={allExpanded ? 'すべて畳む' : 'すべて開く'}
                    >
                      {allExpanded ? '全部閉じる' : '全部開く'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

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
                      const compositeKey = `${workspace.workspaceId}__${dueDateKey}`;
                      const isDueDateExpanded = expandedDueDates.has(compositeKey);
                      const dateInfo = dueDateGroup.dueDate
                        ? getDueDateLabel(dueDateGroup.dueDate)
                        : { label: '期限未設定', isOverdue: false, isDueToday: false };

                      return (
                        <div key={dueDateGroup.listIndex} className="card bg-base-100">
                          {/* 期限日ヘッダー */}
                          <button
                            type="button"
                            className="card-body p-3 cursor-pointer hover:bg-base-200 transition-colors rounded-t-2xl w-full text-left"
                            onClick={() => handleDueDateToggle(workspace.workspaceId, dueDateKey)}
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
                                <span className="badge badge-secondary badge-sm">
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
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
                                {dueDateGroup.tasks.map((task) => {
                                  const isInactive = task.isCompleted || task.isDiscarded;
                                  const iconPath = getTaskTypeIconPath(task);
                                  const toneBorderClass = dateInfo.isOverdue
                                    ? 'border-error/60'
                                    : dateInfo.isDueToday
                                      ? 'border-warning/60'
                                      : 'border-base-300/80';
                                  const toneBarClass = dateInfo.isOverdue
                                    ? 'bg-error/70'
                                    : dateInfo.isDueToday
                                      ? 'bg-warning/70'
                                      : 'bg-base-300/80';

                                  const commentTypeCounts = getCommentTypeCounts(task);
                                  const hasHelpComment = (commentTypeCounts.HelpWanted ?? 0) > 0;
                                  const hasUrgeComment = (commentTypeCounts.Urge ?? 0) > 0;

                                  return (
                                    <div
                                      key={task.listIndex}
                                      className={`relative p-3 rounded-xl border bg-base-100 shadow-sm hover:shadow-md transition-colors ${toneBorderClass} ${isInactive ? 'blur-[1px] opacity-60 hover:blur-none hover:opacity-100' : ''}`}
                                    >
                                      <div
                                        className={`absolute inset-x-3 top-2 h-1.5 rounded-full ${toneBarClass}`}
                                        aria-hidden="true"
                                      />

                                      <div className="mt-3 flex items-center justify-between gap-2">
                                        <span
                                          className={`badge badge-outline badge-xs ${
                                            dateInfo.isOverdue
                                              ? 'border-error text-error'
                                              : dateInfo.isDueToday
                                                ? 'border-warning text-warning'
                                                : 'border-base-300 text-base-content/70'
                                          }`}
                                        >
                                          {dateInfo.label}
                                        </span>
                                        <span className="inline-flex">{getPriorityBadge(task.priority)}</span>
                                      </div>

                                      <div className="mt-2 flex items-start gap-3">
                                        {iconPath && (
                                          <img
                                            src={iconPath}
                                            alt={task.taskTypeName || 'タスクタイプ'}
                                            className="w-7 h-7 rounded flex-shrink-0"
                                            title={task.taskTypeName || undefined}
                                          />
                                        )}
                                        <div className="min-w-0 space-y-1">
                                          <p
                                            className="text-sm font-medium leading-tight line-clamp-2"
                                            title={task.taskContent || undefined}
                                          >
                                            <span className="text-primary font-semibold mr-1">T-{task.sequence}</span>
                                            {task.taskContent}
                                          </p>
                                          <span className="text-xs text-base-content/50 font-mono">
                                            アイテム: #{task.itemCode}
                                          </span>
                                          <Link
                                            href={`/workspaces/${task.workspaceCode}?itemCode=${task.itemCode}`}
                                            className="block text-xs text-base-content/60 line-clamp-1 hover:text-primary transition-colors"
                                            title={task.itemSubject || undefined}
                                          >
                                            {task.itemSubject}
                                          </Link>
                                        </div>
                                      </div>

                                      <div className="mt-3 flex items-center gap-2 text-xs text-base-content/60">
                                        <div className="flex items-center gap-1">
                                          <span
                                            className="icon-[mdi--progress-check] w-3.5 h-3.5 text-base-content/40"
                                            aria-hidden="true"
                                          />
                                          <span>{Math.round(task.progressPercentage || 0)}%</span>
                                        </div>
                                        <div className="flex-1 hidden sm:block">
                                          <progress
                                            className="progress progress-primary w-full h-1"
                                            value={task.progressPercentage || 0}
                                            max="100"
                                          ></progress>
                                        </div>
                                      </div>

                                      <div className="mt-3 flex items-center justify-between gap-2">
                                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                                          {/* 担当者情報 */}
                                          {(displayMode === 'both' || displayMode === 'assigned') && (
                                            <div>
                                              <p className="text-xs text-base-content/50 mb-1">担当者</p>
                                              {task.assignedUserId ? (
                                                <UserAvatar
                                                  userName={task.assignedUsername}
                                                  identityIconUrl={task.assignedAvatarUrl}
                                                  size={20}
                                                  nameClassName="text-xs text-base-content/70 truncate"
                                                />
                                              ) : (
                                                <span className="text-xs text-base-content/50">--</span>
                                              )}
                                            </div>
                                          )}

                                          {/* コミッター情報 */}
                                          {(displayMode === 'both' || displayMode === 'committer') && (
                                            <div>
                                              <p className="text-xs text-base-content/50 mb-1">コミッター</p>
                                              {task.itemCommitterId ? (
                                                <UserAvatar
                                                  userName={task.itemCommitterUsername}
                                                  identityIconUrl={task.itemCommitterAvatarUrl}
                                                  size={20}
                                                  nameClassName="text-xs text-base-content/70 truncate"
                                                />
                                              ) : (
                                                <span className="text-xs text-base-content/50">--</span>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {task.isCompleted && (
                                            <span className="badge badge-success badge-xs">完了</span>
                                          )}
                                          {task.isDiscarded && (
                                            <span className="badge badge-neutral badge-xs">破棄</span>
                                          )}
                                          {!task.isCompleted && !task.isDiscarded && (
                                            <span className="sm:hidden">{getPriorityBadge(task.priority)}</span>
                                          )}
                                          {hasHelpComment && (
                                            <span
                                              className="badge badge-warning badge-xs"
                                              title="ヘルプ要請のコメントがあります"
                                            >
                                              ヘルプ
                                            </span>
                                          )}
                                          {hasUrgeComment && (
                                            <span className="badge badge-error badge-xs" title="督促コメントがあります">
                                              督促
                                            </span>
                                          )}

                                          {taskTypes ? (
                                            <button
                                              type="button"
                                              onClick={() => handleOpenTaskEditModal(task, workspace.workspaceId)}
                                              className="btn btn-soft btn-secondary btn-xs btn-square"
                                              title="タスクを編集"
                                            >
                                              <span className="icon-[mdi--pencil] w-4 h-4" aria-hidden="true" />
                                            </button>
                                          ) : (
                                            <Link
                                              href={`/workspaces/${task.workspaceCode}?itemCode=${task.itemCode}`}
                                              className="btn btn-soft btn-secondary btn-xs btn-square"
                                              title="タスク詳細"
                                            >
                                              <span className="icon-[mdi--open-in-new] w-4 h-4" aria-hidden="true" />
                                            </Link>
                                          )}
                                        </div>
                                      </div>
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
      {editModalOpen && taskTypes && editingTask && editingWorkspaceId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseTaskEditModal}
        >
          {/* モーダルコンテナ */}
          <div
            className="bg-base-100 rounded-box shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルボディ */}
            <div className="flex-1 overflow-y-auto">
              <WorkspaceTaskDetailPage
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
                showNavigationControls={false}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
