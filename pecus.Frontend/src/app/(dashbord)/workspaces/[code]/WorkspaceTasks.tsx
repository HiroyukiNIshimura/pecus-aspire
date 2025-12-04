'use client';

import AddIcon from '@mui/icons-material/Add';
import { useCallback, useEffect, useState } from 'react';
import { searchUsersForWorkspace } from '@/actions/admin/user';
import { getWorkspaceTasks } from '@/actions/workspaceTask';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import TaskStatusFilter, { type TaskStatus } from '@/components/common/TaskStatusFilter';
import type {
  TaskStatusFilter as TaskStatusFilterType,
  UserSearchResultResponse,
  WorkspaceTaskDetailResponse,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { getDisplayIconUrl } from '@/utils/imageUrl';
import CreateWorkspaceTaskModal from './CreateWorkspaceTaskModal';
import EditWorkspaceTaskModal from './EditWorkspaceTaskModal';

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
  /** アイテムのコミッターID（完了操作の権限チェック用） */
  itemCommitterId?: number | null;
  /** アイテムのコミッター名 */
  itemCommitterName?: string | null;
  /** アイテムのコミッターアバターURL */
  itemCommitterAvatarUrl?: string | null;
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
  itemCommitterId,
  itemCommitterName,
  itemCommitterAvatarUrl,
  currentUser,
}: WorkspaceTasksProps) => {
  const notify = useNotify();
  const [tasks, setTasks] = useState<WorkspaceTaskDetailResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

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

  // タスクタイプのアイコンパス
  const getTaskTypeIcon = (taskType?: string) => {
    if (!taskType) return null;
    const iconName = taskType.toLowerCase();
    return `/icons/task/${iconName}.svg`;
  };

  // 優先度の表示
  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    const badges = {
      Critical: { label: '緊急', className: 'badge-error' },
      High: { label: '高', className: 'badge-warning' },
      Medium: { label: '中', className: 'badge-info' },
      Low: { label: '低', className: 'badge-ghost' },
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
          <h3 className="text-lg font-bold">タスク</h3>
          <button
            type="button"
            className="btn btn-outline btn-primary btn-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <AddIcon className="w-4 h-4" />
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
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">タスク ({totalCount})</h3>
        <button
          type="button"
          className="btn  btn-outline btn-primary btn-sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <AddIcon className="w-4 h-4" />
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
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost bg-base-100 shadow-md hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="前のページ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* カードグリッド 4x2 */}
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity ${isLoading ? 'opacity-50' : ''}`}
            style={{ gridAutoRows: '1fr' }}
          >
            {tasks.map((task, index) => {
              const isInactive = task.isCompleted || task.isDiscarded;
              return (
                <button
                  type="button"
                  key={task.id}
                  className={`card bg-base-200 shadow-sm transition-all duration-200 flex flex-col h-full text-left cursor-pointer ${
                    isInactive
                      ? 'opacity-60 blur-[1px] grayscale-[30%] hover:opacity-100 hover:blur-none hover:grayscale-0 hover:shadow-md'
                      : 'hover:shadow-md hover:bg-base-300'
                  }`}
                  onClick={() => handleTaskClick(index)}
                  aria-label={`タスクを編集: ${task.content?.slice(0, 50) || 'タスク'}`}
                >
                  {/* カードボディ: 伸縮する部分 */}
                  <div className="p-3 pb-2 gap-2 flex flex-col flex-1">
                    {/* ヘッダー: アイコン + ステータス */}
                    <div className="flex items-start justify-between gap-2">
                      {/* タスクタイプアイコン */}
                      {task.taskType && getTaskTypeIcon(task.taskType) && (
                        <div className="flex-shrink-0">
                          <img
                            src={getTaskTypeIcon(task.taskType) || undefined}
                            alt={task.taskType}
                            className="w-7 h-7 rounded"
                            title={task.taskType}
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
                  </div>
                </button>
              );
            })}
          </div>

          {/* 右矢印 */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost bg-base-100 shadow-md hover:bg-base-200 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="次のページ"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
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

      {/* タスク作成モーダル */}
      <CreateWorkspaceTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateTaskSuccess}
        workspaceId={workspaceId}
        itemId={itemId}
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
        currentUser={currentUser}
        pageSize={ITEMS_PER_PAGE}
      />
    </div>
  );
};

export default WorkspaceTasks;
