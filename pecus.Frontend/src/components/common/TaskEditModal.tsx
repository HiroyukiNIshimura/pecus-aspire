'use client';

import { useCallback, useEffect, useState } from 'react';
import { searchUsersForWorkspace } from '@/actions/admin/user';
import { getWorkspaceTask, updateWorkspaceTask } from '@/actions/workspaceTask';
import DatePicker from '@/components/common/DatePicker';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import TaskCommentSection from '@/components/workspaceItems/TaskCommentSection';
import TaskTypeSelect, { type TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type {
  TaskPriority,
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

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: number;
  itemId: number;
  taskId: number;
  /** タスクタイプマスタデータ */
  taskTypes: TaskTypeOption[];
  /** 現在ログイン中のユーザー */
  currentUser?: {
    id: number;
    username: string;
    email: string;
    identityIconUrl: string | null;
  } | null;
  /** アイテムのコミッターID（完了操作の権限チェック用） */
  itemCommitterId?: number | null;
  /** アイテムのコミッター名 */
  itemCommitterName?: string | null;
  /** アイテムのコミッターアバターURL */
  itemCommitterAvatarUrl?: string | null;
}

export default function TaskEditModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
  itemId,
  taskId,
  taskTypes,
  currentUser,
  itemCommitterId,
  itemCommitterName,
  itemCommitterAvatarUrl,
}: TaskEditModalProps) {
  const notify = useNotify();
  const [serverErrors, setServerErrors] = useState<{ key: number; message: string }[]>([]);
  const [isLoadingTask, setIsLoadingTask] = useState(false);

  // 現在のタスクデータ
  const [task, setTask] = useState<WorkspaceTaskDetailResponse | null>(null);

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

  // テキストフィールド状態
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

  // 初期化 - モーダルが開いた時にタスクを取得
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    const fetchTask = async () => {
      setIsLoadingTask(true);
      setServerErrors([]);

      try {
        const result = await getWorkspaceTask(workspaceId, itemId, taskId);
        if (isCancelled) return;

        if (result.success) {
          setTask(result.data);
          syncTaskToForm(result.data);
        } else {
          notify.error(result.message || 'タスクの取得に失敗しました');
        }
      } catch {
        if (isCancelled) return;
        notify.error('タスクの取得中にエラーが発生しました');
      } finally {
        if (!isCancelled) {
          setIsLoadingTask(false);
        }
      }
    };

    fetchTask();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, workspaceId, itemId, taskId]);

  // フォームバリデーション設定
  const {
    formRef,
    isSubmitting,
    handleSubmit: handleFormSubmit,
    shouldShowError,
    getFieldError,
  } = useFormValidation({
    schema: updateWorkspaceTaskSchema,
    onSubmit: async () => {
      if (!task) return;

      setServerErrors([]);

      // 入力値の収集
      const request: UpdateWorkspaceTaskRequest = {
        content: content.trim() || null,
        taskTypeId: taskTypeId,
        priority: priority,
        assignedUserId: selectedAssignee?.id,
        startDate: startDate || null,
        dueDate: dueDate || '',
        estimatedHours: estimatedHours > 0 ? estimatedHours : null,
        actualHours: actualHours > 0 ? actualHours : null,
        progressPercentage: progressPercentage,
        isCompleted: isCompleted,
        isDiscarded: isDiscarded,
        discardReason: isDiscarded ? discardReason.trim() || null : null,
        rowVersion: task.rowVersion,
      };

      try {
        const result = await updateWorkspaceTask(workspaceId, itemId, task.id, request);

        if (result.success) {
          notify.success('タスクを更新しました');
          onSuccess();
          onClose();
        } else {
          setServerErrors([{ key: Date.now(), message: result.message }]);
        }
      } catch {
        setServerErrors([{ key: Date.now(), message: 'タスクの更新中にエラーが発生しました' }]);
      }
    },
  });

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
    setSelectedAssignee({
      id: user.id || 0,
      username: user.username || '',
      email: user.email || '',
      identityIconUrl: user.identityIconUrl || null,
    });
    setShowAssigneeDropdown(false);
    setAssigneeSearchResults([]);
  };

  // 担当者クリア
  const handleClearAssignee = () => {
    setSelectedAssignee(null);
  };

  // 自分を担当者に設定
  const handleSelectSelf = () => {
    if (currentUser) {
      setSelectedAssignee({
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        identityIconUrl: currentUser.identityIconUrl,
      });
    }
  };

  // 完了権限チェック（コミッターのみ完了可能）
  const canComplete = currentUser && itemCommitterId === currentUser.id;

  if (!isOpen) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} aria-hidden="true" />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="bg-base-100 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-edit-modal-title"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 flex-shrink-0">
            <h3 id="task-edit-modal-title" className="text-lg font-bold">
              タスク編集
            </h3>
            <button type="button" className="btn btn-sm btn-circle" onClick={onClose} aria-label="閉じる">
              <span className="icon-[mdi--close] w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* ローディング */}
          {isLoadingTask && (
            <div className="flex justify-center items-center py-12 flex-1">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}

          {/* メインコンテンツ: 2パネルレイアウト */}
          {!isLoadingTask && task && (
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* 左パネル：タスクフォーム */}
              <div className="w-1/2 flex-shrink-0 overflow-y-auto border-r border-base-300">
                <form ref={formRef} onSubmit={handleFormSubmit} className="p-6">
                  {/* サーバーエラー表示 */}
                  {serverErrors.length > 0 && (
                    <div className="alert alert-error mb-4">
                      <ul className="list-disc list-inside">
                        {serverErrors.map((error) => (
                          <li key={error.key}>{error.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* コミッター表示 */}
                  {(itemCommitterName || itemCommitterAvatarUrl) && (
                    <div className="flex items-center gap-2 text-sm text-base-content/70 mb-4 pb-3 border-b border-base-300">
                      <span className="text-base-content/50">コミッター:</span>
                      {itemCommitterAvatarUrl && (
                        <img
                          src={getDisplayIconUrl(itemCommitterAvatarUrl)}
                          alt={itemCommitterName || 'コミッター'}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium">{itemCommitterName || '(名前なし)'}</span>
                    </div>
                  )}

                  {/* タスク内容 */}
                  <div className="form-control mb-4">
                    <label htmlFor="content" className="label">
                      <span className="label-text font-semibold">タスク内容</span>
                    </label>
                    <textarea
                      id="content"
                      name="content"
                      className={`textarea textarea-bordered h-24 ${shouldShowError('content') ? 'textarea-error' : ''}`}
                      placeholder="タスクの内容を入力してください"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    {shouldShowError('content') && (
                      <p className="label">
                        <span className="label-text-alt text-error">{getFieldError('content')}</span>
                      </p>
                    )}
                  </div>

                  {/* タスクタイプ・優先度 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label htmlFor="taskTypeId" className="label">
                        <span className="label-text font-semibold">タスクタイプ</span>
                      </label>
                      <TaskTypeSelect taskTypes={taskTypes} value={taskTypeId} onChange={setTaskTypeId} />
                    </div>

                    <div className="form-control">
                      <label htmlFor="priority" className="label">
                        <span className="label-text font-semibold">優先度</span>
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        className="select select-bordered select-sm"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
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
                  <div className="form-control mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="label-text font-semibold">担当者</span>
                      {currentUser && (
                        <button type="button" className="link link-primary text-xs" onClick={handleSelectSelf}>
                          （自分）
                        </button>
                      )}
                    </div>
                    {selectedAssignee ? (
                      <div className="input input-sm input-bordered flex items-center gap-1.5 pr-1">
                        <img
                          src={getDisplayIconUrl(selectedAssignee.identityIconUrl)}
                          alt={selectedAssignee.username}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                        <span className="text-sm truncate flex-1">{selectedAssignee.username}</span>
                        <button
                          type="button"
                          className="p-0.5 hover:bg-base-300 rounded transition-colors flex-shrink-0"
                          onClick={handleClearAssignee}
                          aria-label="選択解除"
                        >
                          <span className="icon-[mdi--close] w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <DebouncedSearchInput
                          onSearch={handleAssigneeSearch}
                          placeholder="名前で検索..."
                          debounceMs={300}
                          size="sm"
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
                                <span className="text-sm font-medium truncate">{user.username}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 日付 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label htmlFor="startDate" className="label">
                        <span className="label-text font-semibold">開始日</span>
                      </label>
                      <DatePicker value={startDate} onChange={setStartDate} />
                    </div>

                    <div className="form-control">
                      <label htmlFor="dueDate" className="label">
                        <span className="label-text font-semibold">期限日</span>
                      </label>
                      <DatePicker value={dueDate} onChange={setDueDate} />
                    </div>
                  </div>

                  {/* 工数 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label htmlFor="estimatedHours" className="label">
                        <span className="label-text font-semibold">予定工数（時間）</span>
                      </label>
                      <input
                        type="number"
                        id="estimatedHours"
                        name="estimatedHours"
                        className="input input-bordered input-sm"
                        min="0"
                        step="0.5"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="form-control">
                      <label htmlFor="actualHours" className="label">
                        <span className="label-text font-semibold">実績工数（時間）</span>
                      </label>
                      <input
                        type="number"
                        id="actualHours"
                        name="actualHours"
                        className="input input-bordered input-sm"
                        min="0"
                        step="0.5"
                        value={actualHours}
                        onChange={(e) => setActualHours(Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  {/* 進捗率 */}
                  <div className="form-control mb-4">
                    <label htmlFor="progressPercentage" className="label">
                      <span className="label-text font-semibold">進捗率: {progressPercentage}%</span>
                    </label>
                    <input
                      type="range"
                      id="progressPercentage"
                      name="progressPercentage"
                      className="range range-primary range-sm"
                      min="0"
                      max="100"
                      step="5"
                      value={progressPercentage}
                      onChange={(e) => setProgressPercentage(Number.parseInt(e.target.value, 10))}
                    />
                  </div>

                  {/* 完了・破棄 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary checkbox-sm"
                          checked={isCompleted}
                          onChange={(e) => setIsCompleted(e.target.checked)}
                          disabled={!canComplete}
                        />
                        <span className="label-text">完了</span>
                        {!canComplete && <span className="text-xs text-base-content/50">（コミッターのみ）</span>}
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-2">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-neutral checkbox-sm"
                          checked={isDiscarded}
                          onChange={(e) => setIsDiscarded(e.target.checked)}
                        />
                        <span className="label-text">破棄</span>
                      </label>
                    </div>
                  </div>

                  {/* 破棄理由 */}
                  {isDiscarded && (
                    <div className="form-control mb-4">
                      <label htmlFor="discardReason" className="label">
                        <span className="label-text font-semibold">破棄理由</span>
                      </label>
                      <textarea
                        id="discardReason"
                        name="discardReason"
                        className="textarea textarea-bordered h-20"
                        placeholder="破棄理由を入力してください"
                        value={discardReason}
                        onChange={(e) => setDiscardReason(e.target.value)}
                      />
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-base-300 mt-6">
                    <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
                      キャンセル
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          更新中...
                        </>
                      ) : (
                        '更新'
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 右パネル：コメントセクション */}
              <div className="w-1/2 flex-shrink-0 flex flex-col bg-base-200/30">
                <TaskCommentSection
                  workspaceId={workspaceId}
                  itemId={itemId}
                  taskId={task.id}
                  currentUserId={currentUser?.id}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
