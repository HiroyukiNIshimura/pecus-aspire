'use client';

import { useCallback, useEffect, useState } from 'react';
import { searchUsersForWorkspace } from '@/actions/admin/user';
import { getWorkspaceTasks } from '@/actions/workspaceTask';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import TaskStatusFilter, { type TaskStatus } from '@/components/common/TaskStatusFilter';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, MessageIcon, PlusIcon } from '@/components/icons';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type {
  TaskStatusFilter as TaskStatusFilterType,
  UserSearchResultResponse,
  WorkspaceTaskDetailResponse,
  WorkspaceTaskStatistics,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { getDisplayIconUrl } from '@/utils/imageUrl';
import CreateWorkspaceTaskModal from './CreateWorkspaceTaskModal';
import EditWorkspaceTaskModal from './EditWorkspaceTaskModal';
import TaskCommentModal from './TaskCommentModal';

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

/** 選択されたユーザー情報 */
interface SelectedUser {
  id: number;
  username: string;
  email: string;
  identityIconUrl: string | null;
}

interface WorkspaceTasksProps {
  workspaceId: number;
  itemId: number;
  /** アイテムのオーナーID */
  itemOwnerId?: number | null;
  /** アイテムの担当者ID */
  itemAssigneeId?: number | null;
  /** アイテムのコミッターID（完了操作の権限チェック用） */
  itemCommitterId?: number | null;
  /** アイテムのコミッター名 */
  itemCommitterName?: string | null;
  /** アイテムのコミッターアバターURL */
  itemCommitterAvatarUrl?: string | null;
  /** タスクタイプマスタデータ */
  taskTypes: TaskTypeOption[];
  /** 現在ログイン中のユーザー（「自分」リンク用） */
  currentUser?: {
    id: number;
    username: string;
    email: string;
    identityIconUrl: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 8; // 4列 x 2行

const WorkspaceTasks = ({
  workspaceId,
  itemId,
  itemOwnerId,
  itemAssigneeId,
  itemCommitterId,
  itemCommitterName,
  itemCommitterAvatarUrl,
  taskTypes,
  currentUser,
}: WorkspaceTasksProps) => {
  const notify = useNotify();
  const [tasks, setTasks] = useState<WorkspaceTaskDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState<WorkspaceTaskStatistics | null>(null);

  // フィルター状態
  const [taskStatus, setTaskStatus] = useState<TaskStatus>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<SelectedUser | null>(null);
  const [assigneeSearchResults, setAssigneeSearchResults] = useState<UserSearchResultResponse[]>([]);
  const [isSearchingAssignee, setIsSearchingAssignee] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // タスク作成モーダル状態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // タスク編集モーダル状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskNavigation, setEditTaskNavigation] = useState<{
    tasks: WorkspaceTaskDetailResponse[];
    currentIndex: number;
    currentPage: number;
    totalPages: number;
    totalCount: number;
    statusFilter: TaskStatusFilterType;
    assignedUserId?: number;
  } | null>(null);

  // コメントモーダル状態
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentTargetTask, setCommentTargetTask] = useState<WorkspaceTaskDetailResponse | null>(null);

  // タスク取得
  const fetchTasks = async (page: number, status: TaskStatus, assigneeId?: number | null) => {
    try {
      setIsLoading(true);

      // サーバー側でフィルタリング
      const result = await getWorkspaceTasks(
        workspaceId,
        itemId,
        page,
        ITEMS_PER_PAGE,
        toApiTaskStatusFilter(status),
        assigneeId ?? undefined,
      );

      if (result.success) {
        setTasks(result.data.data || []);
        setCurrentPage(result.data.currentPage || 1);
        setTotalPages(result.data.totalPages || 0);
        setTotalCount(result.data.totalCount || 0);
        setStatistics(result.data.summary || null);
      } else {
        notify.error(result.message || 'タスクの取得に失敗しました');
      }
    } catch (_err: unknown) {
      notify.error('タスクの取得中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 初回取得
  useEffect(() => {
    fetchTasks(1, taskStatus, selectedAssignee?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, itemId]);

  // フィルター変更時
  const handleFilterChange = (newStatus: TaskStatus, newAssigneeId?: number | null) => {
    setCurrentPage(1);
    fetchTasks(1, newStatus, newAssigneeId);
  };

  // ステータスフィルター変更
  const handleStatusChange = (status: TaskStatus) => {
    setTaskStatus(status);
    handleFilterChange(status, selectedAssignee?.id);
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || isLoading) return;
    fetchTasks(page, taskStatus, selectedAssignee?.id);
  };

  // 担当者検索
  const handleAssigneeSearch = async (query: string) => {
    if (query.length < 2) {
      setAssigneeSearchResults([]);
      setShowAssigneeDropdown(false);
      return;
    }

    setIsSearchingAssignee(true);
    setShowAssigneeDropdown(true);

    try {
      const result = await searchUsersForWorkspace(query);
      if (result.success) {
        setAssigneeSearchResults(result.data || []);
        setShowAssigneeDropdown(true);
      }
    } catch {
      // エラーは無視
    } finally {
      setIsSearchingAssignee(false);
    }
  };

  // 担当者選択
  const handleSelectAssignee = (user: UserSearchResultResponse) => {
    const selected: SelectedUser = {
      id: user.id || 0,
      username: user.username || '',
      email: user.email || '',
      identityIconUrl: user.identityIconUrl || null,
    };
    setSelectedAssignee(selected);
    setShowAssigneeDropdown(false);
    setAssigneeSearchResults([]);
    handleFilterChange(taskStatus, selected.id);
  };

  // 担当者クリア
  const handleClearAssignee = () => {
    setSelectedAssignee(null);
    handleFilterChange(taskStatus, null);
  };

  // 自分を担当者に設定
  const handleSelectSelf = () => {
    if (currentUser) {
      const selected: SelectedUser = {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        identityIconUrl: currentUser.identityIconUrl,
      };
      setSelectedAssignee(selected);
      handleFilterChange(taskStatus, selected.id);
    }
  };

  // タスク作成成功時のハンドラ
  const handleCreateTaskSuccess = () => {
    // タスクリストを最新の状態で再取得
    fetchTasks(1, taskStatus, selectedAssignee?.id);
    setCurrentPage(1);
  };

  // タスクカードクリック時のハンドラ（編集モーダルを開く）
  const handleTaskClick = useCallback(
    (taskIndex: number) => {
      setEditTaskNavigation({
        tasks,
        currentIndex: taskIndex,
        currentPage,
        totalPages,
        totalCount,
        statusFilter: toApiTaskStatusFilter(taskStatus),
        assignedUserId: selectedAssignee?.id,
      });
      setIsEditModalOpen(true);
    },
    [tasks, currentPage, totalPages, totalCount, taskStatus, selectedAssignee?.id],
  );

  // タスク編集成功時のハンドラ
  const handleEditTaskSuccess = useCallback(() => {
    // タスクリストを再取得して最新状態に更新
    fetchTasks(currentPage, taskStatus, selectedAssignee?.id);
  }, [currentPage, taskStatus, selectedAssignee?.id]);

  // コメントボタンクリック時のハンドラ
  const handleCommentClick = useCallback((task: WorkspaceTaskDetailResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommentTargetTask(task);
    setIsCommentModalOpen(true);
  }, []);

  // 編集ボタンクリック時のハンドラ
  const handleEditClick = useCallback(
    (taskIndex: number, e: React.MouseEvent) => {
      e.stopPropagation();
      handleTaskClick(taskIndex);
    },
    [handleTaskClick],
  );

  // タスクタイプのアイコンパスを取得（API レスポンスから）
  const getTaskTypeIconPath = (task: WorkspaceTaskDetailResponse) => {
    // API レスポンスに taskTypeIcon があればそれを使用
    // Icon 値からハイフンを除去してファイル名と一致させる
    if (task.taskTypeIcon) {
      const iconName = task.taskTypeIcon.replace(/-/g, '').toLowerCase();
      return `/icons/task/${iconName}.svg`;
    }
    // フォールバック: taskTypeCode から生成（ハイフンを除去）
    if (task.taskTypeCode) {
      const iconName = task.taskTypeCode.replace(/-/g, '').toLowerCase();
      return `/icons/task/${iconName}.svg`;
    }
    return null;
  };

  // タスクタイプの日本語ラベルを取得（API レスポンスから）
  const getTaskTypeLabel = (task: WorkspaceTaskDetailResponse) => {
    // API レスポンスに taskTypeName があればそれを使用
    if (task.taskTypeName) {
      return task.taskTypeName;
    }
    return '';
  };

  // 優先度の表示
  const getPriorityBadge = (priority?: string) => {
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
  };

  // 初回ローディング（データがまだない場合）
  if (isLoading && tasks.length === 0) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold">タスク</h3>
            {/* コミッター表示 */}
            <div className="flex items-center gap-2 text-sm text-base-content/70 border-l border-base-300 pl-4">
              <span className="text-base-content/50">コミッター:</span>
              {itemCommitterName ? (
                <>
                  {itemCommitterAvatarUrl && (
                    <img
                      src={getDisplayIconUrl(itemCommitterAvatarUrl)}
                      alt={itemCommitterName}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium">{itemCommitterName}</span>
                </>
              ) : (
                <span className="text-base-content/50 italic">未設定</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-primary btn-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusIcon className="w-4 h-4" />
            タスク追加
          </button>
        </div>
        <div className="flex justify-center items-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>

        {/* タスク作成モーダル */}
        <CreateWorkspaceTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateTaskSuccess}
          workspaceId={workspaceId}
          itemId={itemId}
          taskTypes={taskTypes}
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold">タスク ({totalCount})</h3>
          {/* コミッター表示 */}
          <div className="flex items-center gap-2 text-sm text-base-content/70 border-l border-base-300 pl-4">
            <span className="text-base-content/50">コミッター:</span>
            {itemCommitterName ? (
              <>
                {itemCommitterAvatarUrl && (
                  <img
                    src={getDisplayIconUrl(itemCommitterAvatarUrl)}
                    alt={itemCommitterName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="font-medium">{itemCommitterName}</span>
              </>
            ) : (
              <span className="text-base-content/50 italic">未設定</span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn  btn-outline btn-primary btn-sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <PlusIcon className="w-4 h-4" />
          タスク追加
        </button>
      </div>

      {/* フィルターエリア */}
      <div className="flex flex-wrap items-end gap-6 mb-4">
        {/* ステータスフィルター */}
        <TaskStatusFilter value={taskStatus} onChange={handleStatusChange} size="xs" />

        {/* 担当者フィルター */}
        <div className="form-control">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">担当者</span>
            {currentUser && (
              <button type="button" className="link link-primary text-xs" onClick={handleSelectSelf}>
                （自分）
              </button>
            )}
          </div>
          {selectedAssignee ? (
            <div className="input input-xs input-bordered flex items-center gap-1.5 pr-1">
              <img
                src={getDisplayIconUrl(selectedAssignee.identityIconUrl)}
                alt={selectedAssignee.username}
                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
              />
              <span className="text-xs truncate flex-1">{selectedAssignee.username}</span>
              <button
                type="button"
                className="p-0.5 hover:bg-base-300 rounded transition-colors flex-shrink-0"
                onClick={handleClearAssignee}
                aria-label="選択解除"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="relative">
              <DebouncedSearchInput
                onSearch={handleAssigneeSearch}
                placeholder="名前で検索..."
                debounceMs={300}
                size="xs"
                isLoading={isSearchingAssignee}
                showSearchIcon={true}
                showClearButton={true}
              />
              {showAssigneeDropdown && assigneeSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {assigneeSearchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full flex items-center gap-2 p-2 hover:bg-base-200 transition-colors text-left"
                      onClick={() => handleSelectAssignee(user)}
                    >
                      <img
                        src={getDisplayIconUrl(user.identityIconUrl)}
                        alt={user.username || 'User'}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-base-content/50 text-center py-8">タスクはありません</p>
      ) : (
        <div className="relative px-9">
          {/* 左矢印 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-outline btn-primary"
              aria-label="前のページ"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}

          {/* カードグリッド 4x2 */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-3 bg-base-200 p-3 ${isLoading ? 'opacity-50' : ''}`}
            style={{ gridAutoRows: '1fr' }}
          >
            {tasks.map((task, index) => {
              const isInactive = task.isCompleted || task.isDiscarded;
              return (
                <div
                  key={task.id}
                  className={`card flex flex-col h-full ${
                    isInactive ? 'blur-[1px] opacity-60 hover:blur-none hover:opacity-100' : ''
                  }`}
                >
                  {/* カードボディ: 伸縮する部分 */}
                  <div className="p-3 pb-2 gap-2 flex flex-col flex-1">
                    {/* ヘッダー: アイコン + ステータス */}
                    <div className="flex items-start justify-between gap-2">
                      {/* タスクタイプアイコン */}
                      {task.taskTypeId && getTaskTypeIconPath(task) && (
                        <div className="flex-shrink-0">
                          <img
                            src={getTaskTypeIconPath(task) || undefined}
                            alt={getTaskTypeLabel(task)}
                            className="w-7 h-7 rounded"
                            title={getTaskTypeLabel(task)}
                          />
                        </div>
                      )}
                      {/* ステータスバッジ */}
                      <div className="flex flex-wrap gap-1 justify-end">
                        {task.isCompleted && <span className="badge badge-success badge-xs">完了</span>}
                        {task.isDiscarded && <span className="badge badge-neutral badge-xs">破棄</span>}
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>

                    {/* タスク内容（2行で省略、ホバーで全文表示） */}
                    <div className="flex-1">
                      <p className="text-xs line-clamp-2" title={task.content || undefined}>
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

                    {/* 担当者 + 期限（固定高さ） */}
                    <div className="border-t border-base-300 pt-1.5 min-h-[3rem]">
                      {/* 担当者 */}
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-3.5 h-3.5 flex-shrink-0"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                          />
                        </svg>
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

                    {/* アクションボタン */}
                    <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-base-300">
                      {/* 編集ボタン: タスク担当者、アイテムオーナー、アイテム担当者、アイテムコミッタのみ表示 */}
                      {currentUser &&
                        (task.assignedUserId === currentUser.id ||
                          itemOwnerId === currentUser.id ||
                          itemAssigneeId === currentUser.id ||
                          itemCommitterId === currentUser.id) && (
                          <button
                            type="button"
                            className="btn btn-outline btn-primary btn-xs"
                            onClick={(e) => handleEditClick(index, e)}
                            title="編集"
                            aria-label={`タスクを編集: ${task.content?.slice(0, 30) || 'タスク'}`}
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                        )}
                      <button
                        type="button"
                        className="btn btn-outline btn-primary btn-xs relative"
                        onClick={(e) => handleCommentClick(task, e)}
                        title="コメント"
                        aria-label={`コメントを表示: ${task.content?.slice(0, 30) || 'タスク'}`}
                      >
                        <MessageIcon className="w-4 h-4" />
                        {(task.commentCount ?? 0) > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-content rounded-full px-1">
                            {task.commentCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 右矢印 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-outline btn-primary"
              aria-label="次のページ"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}

          {/* ページインジケーター */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={`page-indicator-${pageNum}`}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentPage === pageNum ? 'bg-primary w-4' : 'bg-base-300 hover:bg-base-content/30'
                  }`}
                  aria-label={`ページ ${pageNum}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* タスク統計サマリ */}
      {statistics && (
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h4 className="text-sm font-semibold mb-3 text-base-content/80">タスクサマリ</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 完了 */}
            <div className="flex items-center gap-2 p-2 bg-success/10 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-success/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">完了</p>
                <p className="text-lg font-bold text-success">{statistics.completedCount}</p>
              </div>
            </div>

            {/* 未完了 */}
            <div className="flex items-center gap-2 p-2 bg-info/10 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-info/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-info"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">未完了</p>
                <p className="text-lg font-bold text-info">{statistics.incompleteCount}</p>
              </div>
            </div>

            {/* 期限切れ */}
            <div className="flex items-center gap-2 p-2 bg-error/10 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-error/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">期限切れ</p>
                <p className="text-lg font-bold text-error">{statistics.overdueCount}</p>
              </div>
            </div>

            {/* 今日締切 */}
            <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-warning/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">今日締切</p>
                <p className="text-lg font-bold text-warning">{statistics.dueTodayCount}</p>
              </div>
            </div>

            {/* 7日以内 */}
            <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-accent/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">7日以内</p>
                <p className="text-lg font-bold text-accent">{statistics.dueSoonCount}</p>
              </div>
            </div>

            {/* 期限未設定 */}
            <div className="flex items-center gap-2 p-2 bg-base-300/50 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-base-content/10 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-base-content/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">期限未設定</p>
                <p className="text-lg font-bold text-base-content/70">{statistics.noDueDateCount}</p>
              </div>
            </div>

            {/* 破棄 */}
            <div className="flex items-center gap-2 p-2 bg-neutral/10 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-neutral/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-neutral-content/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">破棄</p>
                <p className="text-lg font-bold text-neutral-content/70">{statistics.discardedCount}</p>
              </div>
            </div>

            {/* コメント数 */}
            <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-primary/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">コメント</p>
                <p className="text-lg font-bold text-primary">{statistics.commentCount}</p>
              </div>
            </div>

            {/* 総件数 */}
            <div className="flex items-center gap-2 p-2 bg-secondary/10 rounded-md">
              <div className="w-8 h-8 flex items-center justify-center bg-secondary/20 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-base-content/60">総件数</p>
                <p className="text-lg font-bold text-secondary">{statistics.totalCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* タスク作成モーダル */}
      <CreateWorkspaceTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateTaskSuccess}
        workspaceId={workspaceId}
        itemId={itemId}
        taskTypes={taskTypes}
        currentUser={currentUser}
      />

      {/* タスク編集モーダル */}
      <EditWorkspaceTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditTaskNavigation(null);
        }}
        onSuccess={handleEditTaskSuccess}
        workspaceId={workspaceId}
        itemId={itemId}
        itemCommitterId={itemCommitterId}
        itemCommitterName={itemCommitterName}
        itemCommitterAvatarUrl={itemCommitterAvatarUrl}
        initialNavigation={editTaskNavigation}
        taskTypes={taskTypes}
        currentUser={currentUser}
        pageSize={ITEMS_PER_PAGE}
      />

      {/* コメントモーダル */}
      {commentTargetTask && currentUser && (
        <TaskCommentModal
          isOpen={isCommentModalOpen}
          onClose={() => {
            setIsCommentModalOpen(false);
            setCommentTargetTask(null);
          }}
          workspaceId={workspaceId}
          itemId={itemId}
          task={commentTargetTask}
          currentUserId={currentUser.id}
          onCommentCountChange={() => handleEditTaskSuccess()}
        />
      )}
    </div>
  );
};

export default WorkspaceTasks;
