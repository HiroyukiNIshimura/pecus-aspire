'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { searchWorkspaceMembers } from '@/actions/workspace';
import {
  checkAssigneeTaskLoad,
  createWorkspaceTask,
  fetchTaskContentSuggestion,
  getPredecessorTaskOptions,
  type PredecessorTaskOption,
} from '@/actions/workspaceTask';
import DatePicker from '@/components/common/filters/DatePicker';
import DebouncedSearchInput from '@/components/common/filters/DebouncedSearchInput';
import AiProgressOverlay from '@/components/common/overlays/AiProgressOverlay';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import TaskTypeSelect, { type TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type {
  AssigneeTaskLoadResponse,
  CreateWorkspaceTaskRequest,
  TaskPriority,
  UserSearchResultResponse,
} from '@/connectors/api/pecus';
import { useAiSuggestion } from '@/hooks/useAiSuggestion';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { useIsAiEnabled, useOrganizationSettings } from '@/providers/AppSettingsProvider';
import { createWorkspaceTaskSchemaWithRequiredEstimate, taskPriorityOptions } from '@/schemas/workspaceTaskSchemas';

/** 選択されたユーザー情報 */
interface SelectedUser {
  id: number;
  username: string;
  email: string;
  identityIconUrl: string | null;
}

interface CreateWorkspaceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: number;
  itemId: number;
  /** タスクタイプマスタデータ */
  taskTypes: TaskTypeOption[];
  /** 現在ログイン中のユーザー（「自分」リンク用） */
  currentUser?: {
    id: number;
    username: string;
    email: string;
    identityIconUrl: string | null;
  } | null;
  /** ワークスペース編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
}

export default function CreateWorkspaceTaskModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
  itemId,
  taskTypes,
  currentUser,
  canEdit = true,
}: CreateWorkspaceTaskModalProps) {
  const notify = useNotify();
  const [serverErrors, setServerErrors] = useState<{ key: number; message: string }[]>([]);
  const assigneeSearchInputRef = useRef<HTMLInputElement>(null);

  // 組織設定（タスク関連）- AppSettingsProviderから取得
  const { requireEstimateOnTaskCreation } = useOrganizationSettings();

  // AI機能が有効かどうか
  const isAiEnabled = useIsAiEnabled();

  // 担当者選択状態
  const [selectedAssignee, setSelectedAssignee] = useState<SelectedUser | null>(null);
  const [assigneeSearchResults, setAssigneeSearchResults] = useState<UserSearchResultResponse[]>([]);
  const [isSearchingAssignee, setIsSearchingAssignee] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  // 日付状態
  const [startDate, setStartDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  // 予定工数状態
  const [estimatedHours, setEstimatedHours] = useState<number>(0);

  // タスクタイプ状態
  const [taskTypeId, setTaskTypeId] = useState<number | null>(null);

  // 先行タスク状態（複数選択対応）
  const [predecessorTaskIds, setPredecessorTaskIds] = useState<number[]>([]);
  const [predecessorTaskOptions, setPredecessorTaskOptions] = useState<PredecessorTaskOption[]>([]);
  const [isLoadingPredecessorTasks, setIsLoadingPredecessorTasks] = useState(false);

  // 先行タスクと期限日の整合性チェック（警告用・複数対応）
  const predecessorDueDateWarnings = useMemo(() => {
    if (!predecessorTaskIds.length || !dueDate) return [];

    const warnings: string[] = [];
    const newTaskDueDate = new Date(dueDate);

    for (const predId of predecessorTaskIds) {
      const selectedPredecessor = predecessorTaskOptions.find((t) => t.id === predId);
      if (!selectedPredecessor || !selectedPredecessor.dueDate) continue;

      const predecessorDueDate = new Date(selectedPredecessor.dueDate);

      // 先行タスクの期限日が新規タスクの期限日より後の場合
      if (predecessorDueDate > newTaskDueDate) {
        const predecessorDueDateStr = predecessorDueDate.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        warnings.push(
          `先行タスク「T-${selectedPredecessor.sequence}」の期限日（${predecessorDueDateStr}）が、このタスクの期限日よりも後に設定されています。`,
        );
      }
    }

    return warnings;
  }, [predecessorTaskIds, dueDate, predecessorTaskOptions]);

  // 担当者負荷チェック
  const [assigneeLoadCheck, setAssigneeLoadCheck] = useState<AssigneeTaskLoadResponse | null>(null);
  const [assigneeLoadError, setAssigneeLoadError] = useState<string | null>(null);

  // タスク内容（AI提案用に controlled に変更）
  const [taskContent, setTaskContent] = useState<string>('');

  // AI提案状態
  const {
    isLoading: isSuggestLoading,
    startLoading,
    finishLoading,
    cancel: cancelSuggestion,
    checkCancelled,
  } = useAiSuggestion();
  const [suggestError, setSuggestError] = useState<string | null>(null);

  // 動的にスキーマを生成（組織設定に基づく）
  const taskSchema = useMemo(
    () => createWorkspaceTaskSchemaWithRequiredEstimate(requireEstimateOnTaskCreation),
    [requireEstimateOnTaskCreation],
  );

  const toISODateString = useCallback((dateStr: string | undefined | null): string | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }, []);

  // 先行タスク候補を取得
  const fetchPredecessorTasks = useCallback(async () => {
    setIsLoadingPredecessorTasks(true);
    try {
      const result = await getPredecessorTaskOptions(workspaceId, itemId);
      if (result.success) {
        setPredecessorTaskOptions(result.data || []);
      }
    } finally {
      setIsLoadingPredecessorTasks(false);
    }
  }, [workspaceId, itemId]);

  // モーダルが開いたら先行タスク候補を取得
  useEffect(() => {
    if (isOpen) {
      fetchPredecessorTasks();
    }
  }, [isOpen, fetchPredecessorTasks]);

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: taskSchema,
      onSubmit: async (data) => {
        // ワークスペース編集権限チェック
        if (!canEdit) {
          notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
          return;
        }

        setServerErrors([]);

        const requestData: CreateWorkspaceTaskRequest = {
          content: data.content,
          taskTypeId: data.taskTypeId,
          assignedUserId: data.assignedUserId,
          priority: data.priority as TaskPriority | undefined,
          startDate: toISODateString(data.startDate),
          dueDate: toISODateString(data.dueDate)!,
          estimatedHours: data.estimatedHours || null,
          predecessorTaskIds: predecessorTaskIds.length > 0 ? predecessorTaskIds : undefined,
        };

        const result = await createWorkspaceTask(workspaceId, itemId, requestData);

        if (!result.success) {
          setServerErrors([{ key: 0, message: result.message }]);
          return;
        }

        notify.success('タスクを作成しました');
        onSuccess();
        onClose();
      },
    });

  // 担当者検索
  const handleAssigneeSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setAssigneeSearchResults([]);
        setShowAssigneeDropdown(false);
        return;
      }

      setIsSearchingAssignee(true);
      setShowAssigneeDropdown(true);

      try {
        const result = await searchWorkspaceMembers(workspaceId, query, true);
        if (result.success) {
          setAssigneeSearchResults(result.data || []);
          setShowAssigneeDropdown(true);
        }
      } catch {
        // エラーは無視
      } finally {
        setIsSearchingAssignee(false);
      }
    },
    [workspaceId],
  );

  // 担当者選択
  const handleSelectAssignee = useCallback(
    (user: UserSearchResultResponse) => {
      const selected: SelectedUser = {
        id: user.id || 0,
        username: user.username || '',
        email: user.email || '',
        identityIconUrl: user.identityIconUrl || null,
      };
      setSelectedAssignee(selected);
      setShowAssigneeDropdown(false);
      setAssigneeSearchResults([]);
      // エラーがある場合は値変更時に再検証
      if (shouldShowError('assignedUserId')) {
        validateField('assignedUserId', user.id || '');
      }
    },
    [shouldShowError, validateField],
  );

  // 担当者クリア
  const handleClearAssignee = useCallback(() => {
    setSelectedAssignee(null);
    // エラーがある場合は値変更時に再検証
    if (shouldShowError('assignedUserId')) {
      validateField('assignedUserId', '');
    }
    // クリア後に検索入力欄にフォーカス
    setTimeout(() => {
      assigneeSearchInputRef.current?.focus();
    }, 0);
  }, [shouldShowError, validateField]);

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
      // エラーがある場合は値変更時に再検証
      if (shouldShowError('assignedUserId')) {
        validateField('assignedUserId', currentUser.id);
      }
    }
  }, [currentUser, shouldShowError, validateField]);

  // タスク内容提案を取得
  const handleSuggestContent = useCallback(async () => {
    if (!taskTypeId || isSuggestLoading) return;

    startLoading();
    setSuggestError(null);

    try {
      const result = await fetchTaskContentSuggestion(workspaceId, itemId, taskTypeId);

      if (checkCancelled()) return;

      if (result.success && result.data.suggestedContent) {
        setTaskContent(result.data.suggestedContent);
        validateField('content', result.data.suggestedContent);
      } else if (!result.success) {
        setSuggestError(result.message || '提案の取得に失敗しました。');
      }
    } catch {
      if (!checkCancelled()) {
        setSuggestError('提案の取得中にエラーが発生しました。');
      }
    } finally {
      if (!checkCancelled()) {
        finishLoading();
      }
    }
  }, [workspaceId, itemId, taskTypeId, isSuggestLoading, validateField, startLoading, finishLoading, checkCancelled]);

  // モーダルが閉じられたらエラーとフォームをクリア
  useEffect(() => {
    if (!isOpen) {
      setServerErrors([]);
      resetForm();
      setSelectedAssignee(null);
      setAssigneeSearchResults([]);
      setShowAssigneeDropdown(false);
      setStartDate('');
      setDueDate('');
      setEstimatedHours(0);
      setTaskTypeId(null);
      setPredecessorTaskIds([]);
      setPredecessorTaskOptions([]);
      setAssigneeLoadCheck(null);
      setAssigneeLoadError(null);
      setTaskContent('');
      setSuggestError(null);
    }
  }, [isOpen, resetForm]);

  // 担当者×期限日のタスク負荷チェック
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedAssignee || !dueDate) {
      setAssigneeLoadCheck(null);
      setAssigneeLoadError(null);
      return;
    }

    let cancelled = false;

    const runCheck = async () => {
      setAssigneeLoadError(null);

      const dueDateISO = toISODateString(dueDate);
      if (!dueDateISO) {
        return;
      }

      const result = await checkAssigneeTaskLoad(workspaceId, itemId, selectedAssignee.id, dueDateISO);

      if (cancelled) return;

      if (result.success) {
        setAssigneeLoadCheck(result.data);
      } else {
        setAssigneeLoadCheck(null);
        setAssigneeLoadError(result.message);
      }
    };

    runCheck();

    return () => {
      cancelled = true;
    };
  }, [selectedAssignee?.id, dueDate, workspaceId, itemId, isOpen, toISODateString]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = () => {
      setShowAssigneeDropdown(false);
    };

    if (showAssigneeDropdown) {
      // 少し遅延させてから登録（選択イベントが先に発火するように）
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showAssigneeDropdown]);

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="icon-[mdi--plus-circle-outline] size-6" aria-hidden="true" />
            タスクを作成
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary btn-circle"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* モーダルボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* フォーム */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                  disabled={isSubmitting}
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
                  data-field="priority"
                  className="select select-bordered"
                  defaultValue="Medium"
                  disabled={isSubmitting}
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
              {/* hidden input for form validation */}
              <input type="hidden" name="assignedUserId" value={selectedAssignee?.id || ''} />
              {selectedAssignee ? (
                <div className="input input-bordered flex items-center gap-2">
                  <UserAvatar
                    userName={selectedAssignee.username}
                    isActive={true}
                    identityIconUrl={selectedAssignee.identityIconUrl}
                    size={24}
                    showName={false}
                  />
                  <span className="text-sm truncate flex-1">{selectedAssignee.username}</span>
                  <button
                    type="button"
                    className="p-1 hover:bg-base-content/10 rounded transition-colors flex-shrink-0"
                    onClick={handleClearAssignee}
                    aria-label="選択解除"
                    disabled={isSubmitting}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <DebouncedSearchInput
                    inputRef={assigneeSearchInputRef}
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
                          <UserAvatar
                            userName={user.username}
                            isActive={true}
                            identityIconUrl={user.identityIconUrl}
                            size={24}
                            showName={false}
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

            {/* タスク内容 */}
            <div className="form-control">
              <div className="label flex items-center gap-2">
                <span className="label-text font-semibold">
                  タスク内容 <span className="text-error">*</span>
                </span>
                {/* AI提案ボタン（AI有効時のみ表示） */}
                {isAiEnabled && (
                  <button
                    type="button"
                    onClick={handleSuggestContent}
                    disabled={!taskTypeId || isSubmitting || isSuggestLoading}
                    className={`btn btn-xs btn-outline gap-1 ${taskTypeId ? 'btn-info' : 'btn-secondary'}`}
                    title={!taskTypeId ? 'タスクタイプを選択すると提案を利用できます' : 'AIがタスク内容を提案します'}
                  >
                    <span className="icon-[mdi--auto-fix] size-4" aria-hidden="true" />
                    提案を利用
                  </button>
                )}
              </div>
              <div className="relative">
                {/* ローディングオーバーレイ */}
                <AiProgressOverlay
                  isVisible={isSuggestLoading}
                  message="AIがタスク内容を生成中..."
                  onCancel={cancelSuggestion}
                  zIndex={10}
                />
                <textarea
                  id="content"
                  data-field="content"
                  placeholder="タスクは、単純かつ具体的で達成可能な内容を入力にします..."
                  className={`textarea textarea-bordered h-24 w-full ${shouldShowError('content') ? 'textarea-error' : ''}`}
                  value={taskContent}
                  onChange={(e) => {
                    setTaskContent(e.target.value);
                    if (shouldShowError('content')) {
                      validateField('content', e.target.value);
                    }
                  }}
                  onBlur={(e) => validateField('content', e.target.value)}
                  disabled={isSubmitting || isSuggestLoading}
                />
              </div>
              {/* 提案エラー表示 */}
              {suggestError && (
                <div className="label">
                  <span className="label-text-alt text-warning">{suggestError}</span>
                </div>
              )}
              {shouldShowError('content') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('content')}</span>
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
                  disabled={isSubmitting}
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
                  onChange={(val) => {
                    setDueDate(val);
                  }}
                  onClose={(val) => {
                    // DatePickerが閉じた時に常に検証を実行
                    validateField('dueDate', val);
                  }}
                  placeholder="期限日を選択"
                  disabled={isSubmitting}
                  error={shouldShowError('dueDate')}
                />
                {shouldShowError('dueDate') && (
                  <div className="label">
                    <span className="label-text-alt text-error">{getFieldError('dueDate')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 先行タスク（複数選択対応） */}
            <div className="form-control">
              <label htmlFor="predecessorTaskIds" className="label">
                <span className="label-text font-semibold">先行タスク</span>
                <span className="label-text-alt text-base-content/60">
                  （これらのタスクが完了しないと着手できない・複数選択可）
                </span>
              </label>
              <div
                id="predecessorTaskIds"
                className="border border-base-300 rounded-lg p-2 max-h-48 overflow-y-auto bg-base-100"
              >
                {predecessorTaskOptions.length === 0 ? (
                  <p className="text-base-content/60 text-sm py-2 text-center">
                    {isLoadingPredecessorTasks ? '' : '選択可能なタスクがありません'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {predecessorTaskOptions.map((task) => (
                      <label
                        key={task.id}
                        className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-base-200 transition-colors ${
                          predecessorTaskIds.includes(task.id) ? 'bg-primary/10' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-primary mt-0.5"
                          checked={predecessorTaskIds.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPredecessorTaskIds([...predecessorTaskIds, task.id]);
                            } else {
                              setPredecessorTaskIds(predecessorTaskIds.filter((id) => id !== task.id));
                            }
                          }}
                          disabled={isSubmitting || isLoadingPredecessorTasks}
                        />
                        <span
                          className={`text-sm flex-1 ${task.isCompleted ? 'line-through text-base-content/50' : ''}`}
                        >
                          T-{task.sequence}:{' '}
                          {task.content.length > 50 ? `${task.content.substring(0, 50)}...` : task.content}
                          {task.isCompleted && <span className="ml-1 badge badge-sm badge-success">完了</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {predecessorTaskIds.length > 0 && (
                <div className="label">
                  <span className="label-text-alt text-base-content/60">
                    {predecessorTaskIds.length}件選択中
                    <button
                      type="button"
                      className="btn btn-xs btn-secondary ml-2"
                      onClick={() => setPredecessorTaskIds([])}
                    >
                      クリア
                    </button>
                  </span>
                </div>
              )}
              {isLoadingPredecessorTasks && (
                <div className="label">
                  <span className="label-text-alt text-base-content/60">
                    <span className="loading loading-spinner loading-xs mr-1" aria-hidden="true" />
                    タスク一覧を読み込み中...
                  </span>
                </div>
              )}
              {predecessorDueDateWarnings.length > 0 && (
                <div className="label flex-col items-start">
                  {predecessorDueDateWarnings.map((warning) => (
                    <span key={warning} className="label-text-alt text-warning flex items-start gap-1">
                      <span className="icon-[mdi--alert-circle-outline] size-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{warning}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 担当者負荷チェック結果（エラーまたは閾値超過時のみ表示） */}
            {(assigneeLoadError || (assigneeLoadCheck?.isExceeded && selectedAssignee)) && (
              <div className="space-y-2">
                {assigneeLoadError && (
                  <div className="alert alert-soft alert-warning">
                    <span className="icon-[mdi--alert-circle-outline] size-5" aria-hidden="true" />
                    <span>{assigneeLoadError}</span>
                  </div>
                )}
                {assigneeLoadCheck?.isExceeded && selectedAssignee && (
                  <div className="alert alert-soft alert-warning">
                    <span className="icon-[mdi--alert-circle-outline] size-5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">同じ期限日の担当タスクが閾値を超えています。</p>
                      <p className="text-sm">
                        {selectedAssignee.username} のタスクが同じ期限日 {dueDate} に{' '}
                        {assigneeLoadCheck.projectedTaskCount} 件 （閾値 {assigneeLoadCheck.threshold}{' '}
                        件）と集中しています。担当者の負荷を考慮して、期限日の調整や担当者の変更を検討してください。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 予定工数 */}
            <div className="form-control">
              <label htmlFor="estimatedHours" className="label">
                <span className="label-text font-semibold">
                  予定工数（時間）
                  {requireEstimateOnTaskCreation && <span className="text-error"> *</span>}
                </span>
              </label>
              <input type="hidden" name="estimatedHours" value={estimatedHours || ''} />
              <div
                className={`input input-bordered max-w-xs flex items-center ${shouldShowError('estimatedHours') ? 'input-error' : ''}`}
              >
                <input
                  id="estimatedHours"
                  type="text"
                  inputMode="decimal"
                  value={estimatedHours || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    let newValue = 0;
                    if (val === '') {
                      newValue = 0;
                    } else {
                      const num = parseFloat(val);
                      if (!Number.isNaN(num) && num >= 0) {
                        newValue = num;
                      } else {
                        return; // 無効な入力は無視
                      }
                    }
                    setEstimatedHours(newValue);
                    // エラーがある場合は値変更時に再検証
                    if (shouldShowError('estimatedHours')) {
                      validateField('estimatedHours', newValue);
                    }
                  }}
                  onBlur={() => validateField('estimatedHours', estimatedHours)}
                  className="flex-1 bg-transparent outline-none min-w-0"
                  placeholder="0"
                  disabled={isSubmitting}
                  aria-label="予定工数入力"
                />
                <span className="my-auto flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                    aria-label="0.5時間減らす"
                    onClick={() => setEstimatedHours((prev) => Math.max(0, (prev || 0) - 0.5))}
                    disabled={isSubmitting || estimatedHours <= 0}
                  >
                    <span className="icon-[mdi--minus-circle-outline] size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                    aria-label="0.5時間増やす"
                    onClick={() => setEstimatedHours((prev) => (prev || 0) + 0.5)}
                    disabled={isSubmitting}
                  >
                    <span className="icon-[mdi--plus-circle-outline] size-4" aria-hidden="true" />
                  </button>
                </span>
              </div>
              {shouldShowError('estimatedHours') && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError('estimatedHours')}</span>
                </div>
              )}
            </div>

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

            {/* ボタングループ */}
            <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    作成中...
                  </>
                ) : (
                  <>
                    <span className="icon-[mdi--plus-circle-outline] w-5 h-5" aria-hidden="true" />
                    作成
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
