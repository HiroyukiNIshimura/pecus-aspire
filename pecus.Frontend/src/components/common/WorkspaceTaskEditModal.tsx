'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchUsersForWorkspace } from '@/actions/admin/user';
import { getWorkspaceTask, getWorkspaceTasks, updateWorkspaceTask } from '@/actions/workspaceTask';
import DatePicker from '@/components/common/DatePicker';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import TaskCommentSection from '@/components/workspaceItems/TaskCommentSection';
import TaskTypeSelect, { type TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type {
  TaskPriority,
  TaskStatusFilter,
  UpdateWorkspaceTaskRequest,
  UserSearchResultResponse,
  WorkspaceTaskDetailResponse,
} from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { taskPriorityOptions, updateWorkspaceTaskSchema } from '@/schemas/workspaceTaskSchemas';
import { getDisplayIconUrl } from '@/utils/imageUrl';

/** 選択されたユーザー情報 */
interface SelectedUser {
  id: number;
  username: string;
  email: string;
  identityIconUrl: string | null;
}

/** タスクナビゲーション情報 */
interface TaskNavigation {
  /** 現在表示中のタスク一覧（現在のページ） */
  tasks: WorkspaceTaskDetailResponse[];
  /** 一覧内での現在のインデックス */
  currentIndex: number;
  /** 一覧のページ番号 */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 総タスク数 */
  totalCount: number;
  /** フィルター条件 */
  statusFilter: TaskStatusFilter;
  assignedUserId?: number;
}

export interface WorkspaceTaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: number;
  itemId: number;
  /** アイテムのコミッターID（完了操作の権限チェック用） */
  itemCommitterId?: number | null;
  /** アイテムのコミッター名 */
  itemCommitterName?: string | null;
  /** アイテムのコミッターアバターURL */
  itemCommitterAvatarUrl?: string | null;
  /** 初期タスクナビゲーション情報 */
  initialNavigation?: TaskNavigation | null;
  /** タスクタイプマスタデータ */
  taskTypes: TaskTypeOption[];
  /** 現在ログイン中のユーザー */
  currentUser?: {
    id: number;
    username: string;
    email: string;
    identityIconUrl: string | null;
  } | null;
  /** ページサイズ（親コンポーネントと同じ値を使用） */
  pageSize?: number;
  /** コメント欄にフォーカスして開くかどうか */
  initialFocusComments?: boolean;
  /** 編集対象タスクID */
  taskId?: number; // タスク単体用（TaskEditModal 互換）
  /** ヘッダーのナビゲーション（前へ/次へ）を表示するか */
  showNavigationControls?: boolean;
}

export default function WorkspaceTaskEditModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
  itemId,
  itemCommitterId,
  itemCommitterName,
  itemCommitterAvatarUrl,
  initialNavigation = null,
  taskTypes,
  currentUser,
  pageSize = 10,
  initialFocusComments = false,
  taskId,
  showNavigationControls = true,
}: WorkspaceTaskEditModalProps) {
  const notify = useNotify();
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);
  const [serverErrors, setServerErrors] = useState<{ key: number; message: string }[]>([]);
  const [isLoadingTask, setIsLoadingTask] = useState(false);

  // 現在のタスクデータ
  const [task, setTask] = useState<WorkspaceTaskDetailResponse | null>(null);

  // ナビゲーション状態
  const [navigation, setNavigation] = useState<TaskNavigation | null>(initialNavigation);

  // 担当者選択状態
  const [selectedAssignee, setSelectedAssignee] = useState<SelectedUser | null>(null);
  const [assigneeSearchResults, setAssigneeSearchResults] = useState<UserSearchResultResponse[]>([]);
  const [isSearchingAssignee, setIsSearchingAssignee] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // 日付状態
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  // 工数状態
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [actualHours, setActualHours] = useState<number>(0);

  // 進捗率状態
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  // 完了・破棄状態
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDiscarded, setIsDiscarded] = useState(false);
  const [discardReason, setDiscardReason] = useState('');

  // テキストフィールド状態（制御されたコンポーネント用）
  const [content, setContent] = useState('');
  const [taskTypeId, setTaskTypeId] = useState<number | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('Medium');

  // タスクデータをフォーム状態に反映
  const syncTaskToForm = useCallback((taskData: WorkspaceTaskDetailResponse) => {
    // 担当者
    if (taskData.assignedUserId) {
      setSelectedAssignee({
        id: taskData.assignedUserId,
        username: taskData.assignedUsername || '',
        email: '',
        identityIconUrl: taskData.assignedAvatarUrl || null,
      });
    } else {
      setSelectedAssignee(null);
    }

    // 日付（ISO形式からYYYY-MM-DD形式に変換）
    const toDateString = (isoStr: string | null | undefined): string => {
      if (!isoStr) return '';
      return isoStr.split('T')[0];
    };
    setStartDate(toDateString(taskData.startDate));
    setDueDate(toDateString(taskData.dueDate));

    // 工数
    setEstimatedHours(taskData.estimatedHours || 0);
    setActualHours(taskData.actualHours || 0);

    // 進捗率
    setProgressPercentage(taskData.progressPercentage || 0);

    // 完了・破棄
    setIsCompleted(taskData.isCompleted || false);
    setIsDiscarded(taskData.isDiscarded || false);
    setDiscardReason(taskData.discardReason || '');

    // テキストフィールド
    setContent(taskData.content || '');
    setTaskTypeId(taskData.taskTypeId || null);
    setPriority(taskData.priority || 'Medium');
  }, []);

  // タスクを取得
  const fetchTask = useCallback(
    async (targetTaskId: number) => {
      setIsLoadingTask(true);
      setServerErrors([]);

      try {
        const result = await getWorkspaceTask(workspaceId, itemId, targetTaskId);
        if (result.success) {
          setTask(result.data);
          syncTaskToForm(result.data);
        } else {
          notifyRef.current.error(result.message || 'タスクの取得に失敗しました');
        }
      } catch {
        notifyRef.current.error('タスクの取得中にエラーが発生しました');
      } finally {
        setIsLoadingTask(false);
      }
    },
    [workspaceId, itemId, syncTaskToForm],
  );

  // 初期化
  useEffect(() => {
    if (isOpen) {
      if (initialNavigation) {
        setNavigation(initialNavigation);
        const currentTask = initialNavigation.tasks[initialNavigation.currentIndex];
        if (currentTask) {
          setTask(currentTask);
          syncTaskToForm(currentTask);
          return;
        }
      }

      // タスクID指定で単体読み込み
      if (taskId) {
        fetchTask(taskId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId, workspaceId, itemId]);

  // 次のタスクに移動
  const handleNextTask = useCallback(async () => {
    if (!navigation || isLoadingTask) return;

    const { tasks, currentIndex, currentPage, totalPages, statusFilter, assignedUserId } = navigation;

    // 現在のページ内で次があればそれを表示
    if (currentIndex < tasks.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextTask = tasks[nextIndex];
      setNavigation({ ...navigation, currentIndex: nextIndex });
      await fetchTask(nextTask.id);
      return;
    }

    // 次のページがあれば取得
    if (currentPage < totalPages) {
      setIsLoadingTask(true);
      try {
        const result = await getWorkspaceTasks(
          workspaceId,
          itemId,
          currentPage + 1,
          pageSize,
          statusFilter,
          assignedUserId,
        );

        if (result.success && result.data.data && result.data.data.length > 0) {
          const newTasks = result.data.data;
          const nextTask = newTasks[0];

          setNavigation({
            ...navigation,
            tasks: newTasks,
            currentIndex: 0,
            currentPage: currentPage + 1,
          });

          await fetchTask(nextTask.id);
        }
      } catch {
        notifyRef.current.error('次のタスクの取得に失敗しました');
      } finally {
        setIsLoadingTask(false);
      }
    }
  }, [navigation, isLoadingTask, workspaceId, itemId, pageSize, fetchTask]);

  // 前のタスクに移動
  const handlePrevTask = useCallback(async () => {
    if (!navigation || isLoadingTask) return;

    const { tasks, currentIndex, currentPage, statusFilter, assignedUserId } = navigation;

    // 現在のページ内で前があればそれを表示
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevTask = tasks[prevIndex];
      setNavigation({ ...navigation, currentIndex: prevIndex });
      await fetchTask(prevTask.id);
      return;
    }

    // 前のページがあれば取得
    if (currentPage > 1) {
      setIsLoadingTask(true);
      try {
        const result = await getWorkspaceTasks(
          workspaceId,
          itemId,
          currentPage - 1,
          pageSize,
          statusFilter,
          assignedUserId,
        );

        if (result.success && result.data.data && result.data.data.length > 0) {
          const newTasks = result.data.data;
          const lastIndex = newTasks.length - 1;
          const prevTask = newTasks[lastIndex];

          setNavigation({
            ...navigation,
            tasks: newTasks,
            currentIndex: lastIndex,
            currentPage: currentPage - 1,
          });

          await fetchTask(prevTask.id);
        }
      } catch {
        notifyRef.current.error('前のタスクの取得に失敗しました');
      } finally {
        setIsLoadingTask(false);
      }
    }
  }, [navigation, isLoadingTask, workspaceId, itemId, pageSize, fetchTask]);

  // ナビゲーション可能かどうか
  const canGoPrev = navigation ? navigation.currentIndex > 0 || navigation.currentPage > 1 : false;

  const canGoNext = navigation
    ? navigation.currentIndex < navigation.tasks.length - 1 || navigation.currentPage < navigation.totalPages
    : false;

  // 現在の位置を計算（1-indexed）
  const currentPosition = navigation ? (navigation.currentPage - 1) * pageSize + navigation.currentIndex + 1 : 0;

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: updateWorkspaceTaskSchema,
      onSubmit: async (data) => {
        if (!task) return;
        setServerErrors([]);

        if (!selectedAssignee) {
          setServerErrors([{ key: 0, message: '担当者を選択してください。' }]);
          return;
        }

        // 日付を ISO 8601 形式（UTC）に変換
        const toISODateString = (dateStr: string | undefined | null): string | null => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          return date.toISOString();
        };

        // dueDateは必須なので変換して必ずnon-nullを保証
        const dueDateISO = toISODateString(data.dueDate);
        if (!dueDateISO) {
          setServerErrors([{ key: 0, message: '期限日は必須です。' }]);
          return;
        }

        const requestData: UpdateWorkspaceTaskRequest = {
          content: data.content,
          taskTypeId: data.taskTypeId,
          assignedUserId: selectedAssignee.id,
          priority: data.priority as TaskPriority | undefined,
          startDate: toISODateString(data.startDate),
          dueDate: dueDateISO,
          estimatedHours: data.estimatedHours || null,
          actualHours: data.actualHours || null,
          progressPercentage: data.progressPercentage ?? 0,
          isCompleted: data.isCompleted || false,
          isDiscarded: data.isDiscarded || false,
          discardReason: data.isDiscarded ? data.discardReason : null,
          rowVersion: task.rowVersion,
        };

        const result = await updateWorkspaceTask(workspaceId, itemId, task.id, requestData);

        if (!result.success) {
          if (result.error === 'conflict') {
            // 競合エラーの場合、最新データを取得して再表示
            notifyRef.current.error('他のユーザーが更新しました。最新のデータを取得します。');
            await fetchTask(task.id);
            return;
          }
          setServerErrors([{ key: 0, message: result.message }]);
          return;
        }

        notifyRef.current.success('タスクを更新しました');

        // 更新後、最新データを取得してフォームに反映
        await fetchTask(task.id);
        onSuccess();
      },
    });

  // 担当者検索
  const handleAssigneeSearch = useCallback(async (query: string) => {
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
  }, []);

  // 担当者選択
  const handleSelectAssignee = useCallback((user: UserSearchResultResponse) => {
    const selected: SelectedUser = {
      id: user.id || 0,
      username: user.username || '',
      email: user.email || '',
      identityIconUrl: user.identityIconUrl || null,
    };
    setSelectedAssignee(selected);
    setShowAssigneeDropdown(false);
    setAssigneeSearchResults([]);
  }, []);

  // 担当者クリア
  const handleClearAssignee = useCallback(() => {
    setSelectedAssignee(null);
  }, []);

  // 自分を担当者に設定
  const handleSelectSelf = useCallback(() => {
    if (currentUser) {
      const selected: SelectedUser = {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        identityIconUrl: currentUser.identityIconUrl,
      };
      setSelectedAssignee(selected);
    }
  }, [currentUser]);

  // モーダルが閉じられたらクリア
  useEffect(() => {
    if (!isOpen) {
      setServerErrors([]);
      resetForm();
      setTask(null);
      setNavigation(initialNavigation ?? null);
      setSelectedAssignee(null);
      setAssigneeSearchResults([]);
      setShowAssigneeDropdown(false);
      setStartDate('');
      setDueDate('');
      setEstimatedHours(0);
      setActualHours(0);
      setProgressPercentage(0);
      setIsCompleted(false);
      setIsDiscarded(false);
      setDiscardReason('');
      setContent('');
      setTaskTypeId(null);
      setPriority('Medium');
    }
  }, [isOpen, resetForm, initialNavigation]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAssigneeDropdown(false);
    };

    if (showAssigneeDropdown) {
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showAssigneeDropdown]);

  // キーボードナビゲーション
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // フォーム入力中は無視
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault();
        handlePrevTask();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        handleNextTask();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canGoPrev, canGoNext, handlePrevTask, handleNextTask, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-base-100 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-base-300 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="icon-[mdi--pencil-outline] size-6" aria-hidden="true" />
                タスクを編集
              </h2>
              {/* ナビゲーションインジケーター */}
              {showNavigationControls && navigation && navigation.totalCount > 1 && (
                <span className="text-sm text-base-content/60">
                  {currentPosition} / {navigation.totalCount}
                </span>
              )}
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
            <div className="flex items-center gap-2">
              {showNavigationControls && (
                <>
                  {/* 前へボタン */}
                  <button
                    type="button"
                    className="btn btn-sm btn-circle btn-secondary"
                    onClick={handlePrevTask}
                    disabled={!canGoPrev || isLoadingTask || isSubmitting}
                    aria-label="前のタスク"
                    title="前のタスク (←)"
                  >
                    <span className="icon-[mdi--chevron-left] size-5" aria-hidden="true" />
                  </button>
                  {/* 次へボタン */}
                  <button
                    type="button"
                    className="btn btn-sm btn-circle btn-secondary"
                    onClick={handleNextTask}
                    disabled={!canGoNext || isLoadingTask || isSubmitting}
                    aria-label="次のタスク"
                    title="次のタスク (→)"
                  >
                    <span className="icon-[mdi--chevron-right] size-5" aria-hidden="true" />
                  </button>
                </>
              )}
              {/* 閉じるボタン */}
              <button
                type="button"
                className="btn btn-sm btn-circle"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="閉じる"
              >
                <span className="icon-[mdi--close] size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* モーダルボディ - サイドバイサイドレイアウト */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* 左パネル：編集フォーム */}
            <div className="flex-1 p-4 overflow-y-auto border-r border-base-300">
              {isLoadingTask && !task ? (
                <div className="flex justify-center items-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : !task ? (
                <p className="text-center text-base-content/50 py-8">タスクが見つかりません</p>
              ) : (
                <>
                  {/* サーバーエラー表示 */}
                  {serverErrors.length > 0 && (
                    <div className="alert alert-soft alert-error mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 shrink-0 stroke-current"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h3 className="font-bold">エラーが発生しました</h3>
                        <ul className="list-disc list-inside mt-2">
                          {serverErrors.map((error) => (
                            <li key={error.key}>{error.message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ローディングオーバーレイ */}
                  {isLoadingTask && (
                    <div className="absolute inset-0 bg-base-100/50 flex items-center justify-center z-10">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  )}

                  {/* フォーム */}
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 relative" noValidate>
                    {/* タスク内容 */}
                    <div className="form-control">
                      <label htmlFor="content" className="label">
                        <span className="label-text font-semibold">
                          タスク内容 <span className="text-error">*</span>
                        </span>
                      </label>
                      <textarea
                        id="content"
                        name="content"
                        placeholder="タスクの内容を入力してください..."
                        className={`textarea textarea-bordered h-24 ${shouldShowError('content') ? 'textarea-error' : ''}`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={(e) => validateField('content', e.target.value)}
                        disabled={isSubmitting || isLoadingTask}
                      />
                      {shouldShowError('content') && (
                        <div className="label">
                          <span className="label-text-alt text-error">{getFieldError('content')}</span>
                        </div>
                      )}
                    </div>

                    {/* タスクタイプと優先度を横並び */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* タスクタイプ */}
                      <div className="form-control">
                        <label htmlFor="taskTypeId" className="label">
                          <span className="label-text font-semibold">
                            タスクタイプ <span className="text-error">*</span>
                          </span>
                        </label>
                        <input type="hidden" name="taskTypeId" value={taskTypeId || ''} />
                        <TaskTypeSelect
                          id="taskTypeId"
                          taskTypes={taskTypes}
                          value={taskTypeId}
                          error={shouldShowError('taskTypeId')}
                          disabled={isSubmitting || isLoadingTask}
                          onChange={(val) => {
                            setTaskTypeId(val);
                            validateField('taskTypeId', val || '');
                          }}
                        />
                        {shouldShowError('taskTypeId') && (
                          <div className="label">
                            <span className="label-text-alt text-error">{getFieldError('taskTypeId')}</span>
                          </div>
                        )}
                      </div>

                      {/* 優先度 */}
                      <div className="form-control">
                        <label htmlFor="priority" className="label">
                          <span className="label-text font-semibold">優先度</span>
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          className="select select-bordered"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as TaskPriority)}
                          disabled={isSubmitting || isLoadingTask}
                        >
                          {taskPriorityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 担当者 */}
                    <div className="form-control">
                      <div className="flex items-center gap-2 mb-1">
                        <label htmlFor="assignedUserId" className="label py-0">
                          <span className="label-text font-semibold">
                            担当者 <span className="text-error">*</span>
                          </span>
                        </label>
                        {currentUser && (
                          <button type="button" className="link link-primary text-xs" onClick={handleSelectSelf}>
                            （自分を設定）
                          </button>
                        )}
                      </div>
                      <input type="hidden" name="assignedUserId" value={selectedAssignee?.id || ''} />
                      {selectedAssignee ? (
                        <div className="input input-bordered flex items-center gap-2">
                          <img
                            src={getDisplayIconUrl(selectedAssignee.identityIconUrl)}
                            alt={selectedAssignee.username}
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                          <span className="text-sm truncate flex-1">{selectedAssignee.username}</span>
                          <button
                            type="button"
                            className="p-1 hover:bg-base-300 rounded transition-colors flex-shrink-0"
                            onClick={handleClearAssignee}
                            aria-label="選択解除"
                            disabled={isSubmitting || isLoadingTask}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <DebouncedSearchInput
                            onSearch={handleAssigneeSearch}
                            placeholder="名前で検索..."
                            debounceMs={300}
                            size="md"
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
                                  className="w-full flex items-center gap-2 p-3 hover:bg-base-200 transition-colors text-left"
                                  onClick={() => handleSelectAssignee(user)}
                                >
                                  <img
                                    src={getDisplayIconUrl(user.identityIconUrl)}
                                    alt={user.username || 'User'}
                                    className="w-6 h-6 rounded-full object-cover"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user.username}</p>
                                    <p className="text-xs text-base-content/50 truncate">{user.email}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {shouldShowError('assignedUserId') && (
                        <div className="label">
                          <span className="label-text-alt text-error">{getFieldError('assignedUserId')}</span>
                        </div>
                      )}
                    </div>

                    {/* 開始日・期限日を横並び */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 開始日 */}
                      <div className="form-control">
                        <label htmlFor="startDate" className="label">
                          <span className="label-text font-semibold">開始日</span>
                        </label>
                        <input type="hidden" name="startDate" value={startDate} />
                        <DatePicker
                          value={startDate}
                          onChange={setStartDate}
                          placeholder="開始日を選択"
                          disabled={isSubmitting || isLoadingTask}
                        />
                      </div>

                      {/* 期限日 */}
                      <div className="form-control">
                        <label htmlFor="dueDate" className="label">
                          <span className="label-text font-semibold">
                            期限日 <span className="text-error">*</span>
                          </span>
                        </label>
                        <input type="hidden" name="dueDate" value={dueDate} />
                        <DatePicker
                          value={dueDate}
                          onChange={setDueDate}
                          placeholder="期限日を選択"
                          disabled={isSubmitting || isLoadingTask}
                        />
                      </div>
                    </div>

                    {/* 工数（予定・実績）を横並び */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 予定工数 */}
                      <div className="form-control">
                        <label htmlFor="estimatedHours" className="label">
                          <span className="label-text font-semibold">予定工数（時間）</span>
                        </label>
                        <input type="hidden" name="estimatedHours" value={estimatedHours || ''} />
                        <div className="input input-bordered flex items-center">
                          <input
                            id="estimatedHours"
                            type="text"
                            inputMode="decimal"
                            value={estimatedHours || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setEstimatedHours(0);
                              } else {
                                const num = parseFloat(val);
                                if (!Number.isNaN(num) && num >= 0) {
                                  setEstimatedHours(num);
                                }
                              }
                            }}
                            className="flex-1 bg-transparent outline-none min-w-0"
                            placeholder="0"
                            disabled={isSubmitting || isLoadingTask}
                            aria-label="予定工数入力"
                          />
                          <span className="my-auto flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                              aria-label="0.5時間減らす"
                              onClick={() => setEstimatedHours((prev) => Math.max(0, (prev || 0) - 0.5))}
                              disabled={isSubmitting || isLoadingTask || estimatedHours <= 0}
                            >
                              <span className="icon-[mdi--minus-circle-outline] size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                              aria-label="0.5時間増やす"
                              onClick={() => setEstimatedHours((prev) => (prev || 0) + 0.5)}
                              disabled={isSubmitting || isLoadingTask}
                            >
                              <span className="icon-[mdi--plus-circle-outline] size-4" aria-hidden="true" />
                            </button>
                          </span>
                        </div>
                      </div>

                      {/* 実績工数 */}
                      <div className="form-control">
                        <label htmlFor="actualHours" className="label">
                          <span className="label-text font-semibold">実績工数（時間）</span>
                        </label>
                        <input type="hidden" name="actualHours" value={actualHours || ''} />
                        <div className="input input-bordered flex items-center">
                          <input
                            id="actualHours"
                            type="text"
                            inputMode="decimal"
                            value={actualHours || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setActualHours(0);
                              } else {
                                const num = parseFloat(val);
                                if (!Number.isNaN(num) && num >= 0) {
                                  setActualHours(num);
                                }
                              }
                            }}
                            className="flex-1 bg-transparent outline-none min-w-0"
                            placeholder="0"
                            disabled={isSubmitting || isLoadingTask}
                            aria-label="実績工数入力"
                          />
                          <span className="my-auto flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                              aria-label="0.5時間減らす"
                              onClick={() => setActualHours((prev) => Math.max(0, (prev || 0) - 0.5))}
                              disabled={isSubmitting || isLoadingTask || actualHours <= 0}
                            >
                              <span className="icon-[mdi--minus-circle-outline] size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                              aria-label="0.5時間増やす"
                              onClick={() => setActualHours((prev) => (prev || 0) + 0.5)}
                              disabled={isSubmitting || isLoadingTask}
                            >
                              <span className="icon-[mdi--plus-circle-outline] size-4" aria-hidden="true" />
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 進捗率 */}
                    <div className="form-control">
                      <label htmlFor="progressPercentage" className="label">
                        <span className="label-text font-semibold">進捗率: {progressPercentage}%</span>
                      </label>
                      <input type="hidden" name="progressPercentage" value={progressPercentage} />
                      <input
                        id="progressPercentage"
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        className="range range-primary"
                        value={progressPercentage}
                        onChange={(e) => setProgressPercentage(Number(e.target.value))}
                        disabled={isSubmitting || isLoadingTask}
                      />
                      <div className="flex justify-between text-xs px-2 mt-1">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* 完了フラグ */}
                    <div className="flex flex-wrap gap-6 items-center">
                      {/* 完了フラグ */}
                      <div className="form-control">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isCompleted"
                            name="isCompleted"
                            className="switch switch-outline switch-success"
                            checked={isCompleted}
                            onChange={(e) => {
                              setIsCompleted(e.target.checked);
                              if (e.target.checked) {
                                setIsDiscarded(false);
                                setProgressPercentage(100);
                              }
                            }}
                            disabled={
                              isSubmitting ||
                              isLoadingTask ||
                              (itemCommitterId != null && currentUser?.id !== itemCommitterId)
                            }
                            title={
                              itemCommitterId != null && currentUser?.id !== itemCommitterId
                                ? '完了操作はコミッターのみ可能です'
                                : undefined
                            }
                          />
                          <label htmlFor="isCompleted" className="label-text cursor-pointer">
                            完了
                            {itemCommitterId != null && currentUser?.id !== itemCommitterId && (
                              <span className="text-xs text-base-content/50 ml-1">(コミッターのみ)</span>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* 破棄フラグ */}
                      <div className="form-control">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isDiscarded"
                            name="isDiscarded"
                            className="switch switch-outline switch-warning"
                            checked={isDiscarded}
                            onChange={(e) => {
                              setIsDiscarded(e.target.checked);
                              if (e.target.checked) {
                                setIsCompleted(false);
                              }
                            }}
                            disabled={isSubmitting || isLoadingTask}
                          />
                          <label htmlFor="isDiscarded" className="label-text cursor-pointer">
                            破棄
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 破棄理由（破棄時のみ表示） */}
                    {isDiscarded && (
                      <div className="form-control">
                        <label htmlFor="discardReason" className="label">
                          <span className="label-text font-semibold">
                            破棄理由 <span className="text-error">*</span>
                          </span>
                        </label>
                        <textarea
                          id="discardReason"
                          name="discardReason"
                          placeholder="破棄の理由を入力してください..."
                          className={`textarea textarea-bordered h-20 ${shouldShowError('discardReason') ? 'textarea-error' : ''}`}
                          value={discardReason}
                          onChange={(e) => setDiscardReason(e.target.value)}
                          onBlur={(e) => validateField('discardReason', e.target.value)}
                          disabled={isSubmitting || isLoadingTask}
                          required
                        />
                        {shouldShowError('discardReason') && (
                          <div className="label">
                            <span className="label-text-alt text-error">{getFieldError('discardReason')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* メタ情報（作成者・更新日時） */}
                    <div className="border-t border-base-300 pt-4 mt-4">
                      <div className="flex flex-wrap gap-4 text-sm text-base-content/60">
                        {task.createdByUserId && (
                          <div className="flex items-center gap-2">
                            <span>作成者:</span>
                            {task.createdByAvatarUrl && (
                              <img
                                src={getDisplayIconUrl(task.createdByAvatarUrl)}
                                alt={task.createdByUsername || ''}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            )}
                            <span>{task.createdByUsername}</span>
                          </div>
                        )}
                        {task.createdAt && <div>作成日時: {new Date(task.createdAt).toLocaleString('ja-JP')}</div>}
                        {task.updatedAt && <div>更新日時: {new Date(task.updatedAt).toLocaleString('ja-JP')}</div>}
                      </div>
                    </div>

                    {/* ボタングループ */}
                    <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={onClose}
                        disabled={isSubmitting || isLoadingTask}
                      >
                        キャンセル
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoadingTask}>
                        {isSubmitting ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            保存中...
                          </>
                        ) : (
                          <>
                            <span className="icon-[mdi--pencil-outline] w-5 h-5" aria-hidden="true" />
                            保存
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* 右パネル：コメントセクション */}
            <div className="w-1/2 flex-shrink-0 flex flex-col bg-base-200/30">
              {task && (
                <TaskCommentSection
                  workspaceId={workspaceId}
                  itemId={itemId}
                  taskId={task.id}
                  currentUserId={currentUser?.id}
                  autoFocus={initialFocusComments}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
