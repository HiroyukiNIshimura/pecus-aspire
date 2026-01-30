'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getUnnotifiedAchievements, markAllAchievementsNotified } from '@/actions/achievement';
import { searchWorkspaceMembers } from '@/actions/workspace';
import { fetchWorkspaceItemAttachments } from '@/actions/workspaceItemAttachment';
import {
  getPredecessorTaskOptions,
  getWorkspaceTask,
  getWorkspaceTasks,
  type PredecessorTaskOption,
  updateWorkspaceTask,
} from '@/actions/workspaceTask';

import { EmptyState } from '@/components/common/feedback/EmptyState';
import DatePicker from '@/components/common/filters/DatePicker';
import DebouncedSearchInput from '@/components/common/filters/DebouncedSearchInput';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import { ItemAttachmentModal } from '@/components/workspaceItems/attachments';
import TaskCommentSection from '@/components/workspaceItems/TaskCommentSection';
import TaskTypeSelect, { type TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type {
  TaskPriority,
  TaskStatusFilter,
  UpdateWorkspaceTaskRequest,
  UserSearchResultResponse,
  WorkspaceItemAttachmentResponse,
  WorkspaceTaskDetailResponse,
} from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { formatDateTime } from '@/libs/utils/date';
import { useOrganizationSettings } from '@/providers/AppSettingsProvider';
import type { TaskEditStatus as TaskEditStatusType } from '@/providers/SignalRProvider';
import { useSignalRContext } from '@/providers/SignalRProvider';
import { taskPriorityOptions, updateWorkspaceTaskSchemaWithRequiredEstimate } from '@/schemas/workspaceTaskSchemas';
import { useAchievementCelebrationStore } from '@/stores/achievementCelebrationStore';

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

export interface WorkspaceTaskDetailPageProps {
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: number;
  itemId: number;
  /** アイテムのオーナーID（権限チェック用） */
  itemOwnerId?: number | null;
  /** アイテムの担当者ID（権限チェック用） */
  itemAssigneeId?: number | null;
  /** アイテムのコミッターID（完了操作の権限チェック用） */
  itemCommitterId?: number | null;
  /** アイテムのコミッター名 */
  itemCommitterName?: string | null;
  /** アイテムのコミッターがアクティブかどうか */
  itemCommitterIsActive?: boolean;
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
  taskId?: number;
  /** ヘッダーのナビゲーション（前へ/次へ）を表示するか */
  showNavigationControls?: boolean;
  /** モーダルとして表示するか（閉じるボタンのスタイルが変わる） */
  isModal?: boolean;
  /** タスクフローマップを表示するコールバック */
  onShowFlowMap?: () => void;
  /** 指定タスクへナビゲートするコールバック（先行タスクリンク用） */
  onNavigateToTask?: (taskSequence: number) => void;
  /** 編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
  /** ワークスペースコード（参照コード生成用） */
  workspaceCode?: string;
  /** アイテムコード（参照コード生成用） */
  itemCode?: string;
}

export default function WorkspaceTaskDetailPage({
  onClose,
  onSuccess,
  workspaceId,
  itemId,
  itemCommitterName,
  itemCommitterIsActive,
  itemCommitterAvatarUrl,
  initialNavigation = null,
  taskTypes,
  currentUser,
  pageSize = 10,
  initialFocusComments = false,
  taskId,
  showNavigationControls = true,
  isModal = false,
  onShowFlowMap,
  onNavigateToTask,
  canEdit = true,
  workspaceCode,
  itemCode,
}: WorkspaceTaskDetailPageProps) {
  const notify = useNotify();
  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);
  const [serverErrors, setServerErrors] = useState<{ key: number; message: string }[]>([]);
  // 初期ロード中はtrueにしておく（「タスクが見つかりません」が一瞬表示されるのを防ぐ）
  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const {
    joinTask,
    leaveTask,
    startTaskEdit,
    endTaskEdit,
    getTaskEditStatus,
    connectionState,
    onTaskEditStarted,
    onTaskEditEnded,
  } = useSignalRContext();
  const [taskEditStatus, setTaskEditStatus] = useState<TaskEditStatusType>({ isEditing: false });
  const [taskEditStatusFetched, setTaskEditStatusFetched] = useState(false);
  // SignalR初期化が開始されたかどうか（初期化開始前はローディング表示しない）
  const [signalRInitStarted, setSignalRInitStarted] = useState(false);
  const startedTaskEditRef = useRef<number | null>(null);
  const prevTaskIdRef = useRef<number | null>(null);
  const effectiveCurrentUserIdRef = useRef<number>(0);
  const hasEditPermissionRef = useRef<boolean>(false);
  const assigneeSearchInputRef = useRef<HTMLInputElement>(null);

  // 組織設定（タスク関連）- AppSettingsProviderから取得
  const { requireEstimateOnTaskCreation, enforcePredecessorCompletion } = useOrganizationSettings();

  // SignalR関数をrefで保持（useEffect依存配列から外すため）
  const signalRRef = useRef({
    joinTask,
    leaveTask,
    startTaskEdit,
    endTaskEdit,
    getTaskEditStatus,
    onTaskEditStarted,
    onTaskEditEnded,
  });
  signalRRef.current = {
    joinTask,
    leaveTask,
    startTaskEdit,
    endTaskEdit,
    getTaskEditStatus,
    onTaskEditStarted,
    onTaskEditEnded,
  };

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

  // 添付ファイル状態
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [taskAttachments, setTaskAttachments] = useState<WorkspaceItemAttachmentResponse[]>([]);
  const [attachmentCount, setAttachmentCount] = useState(0);

  // バッジ取得演出
  const showCelebration = useAchievementCelebrationStore((state) => state.showCelebration);

  // テキストフィールド状態（制御されたコンポーネント用）
  const [content, setContent] = useState('');
  const [taskTypeId, setTaskTypeId] = useState<number | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('Medium');

  // 先行タスク状態（複数選択対応）
  const [predecessorTaskIds, setPredecessorTaskIds] = useState<number[]>([]);
  const [predecessorTaskOptions, setPredecessorTaskOptions] = useState<PredecessorTaskOption[]>([]);

  // 動的にスキーマを生成（組織設定に基づく）
  const taskSchema = useMemo(
    () => updateWorkspaceTaskSchemaWithRequiredEstimate(requireEstimateOnTaskCreation),
    [requireEstimateOnTaskCreation],
  );

  // 現在選択中の先行タスクに未完了のものがあるかどうかを判定（複数対応）
  const isPredecessorIncomplete = useMemo(() => {
    if (!predecessorTaskIds.length) return false;
    return predecessorTaskIds.some((predId) => {
      const selectedPredecessor = predecessorTaskOptions.find((t) => t.id === predId);
      if (selectedPredecessor) {
        return !selectedPredecessor.isCompleted;
      }
      // フォールバック：サーバーから取得した元の先行タスク情報を参照
      const origPred = task?.predecessorTasks?.find((p) => p.id === predId);
      return origPred ? !origPred.isCompleted : false;
    });
  }, [predecessorTaskIds, predecessorTaskOptions, task?.predecessorTasks]);

  // 先行タスクと期限日の整合性チェック（警告用・複数対応）
  const predecessorDueDateWarnings = useMemo(() => {
    if (!predecessorTaskIds.length || !dueDate) return [];

    const warnings: string[] = [];
    const taskDueDate = new Date(dueDate);

    for (const predId of predecessorTaskIds) {
      const selectedPredecessor = predecessorTaskOptions.find((t) => t.id === predId);
      if (!selectedPredecessor || !selectedPredecessor.dueDate) continue;

      const predecessorDueDate = new Date(selectedPredecessor.dueDate);

      // 先行タスクの期限日がこのタスクの期限日より後の場合
      if (predecessorDueDate > taskDueDate) {
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

  const effectiveCurrentUserId = currentUser?.id ?? 0;
  effectiveCurrentUserIdRef.current = effectiveCurrentUserId;

  // ロック判定：他ユーザーが編集中、またはステータス未取得の場合はロック扱い
  const isLockedByOther = taskEditStatus.isEditing
    ? taskEditStatus.editor
      ? taskEditStatus.editor.userId !== effectiveCurrentUserId
      : true
    : false;

  // ステータス取得完了前は編集不可（ロック状態を正確に判定できないため）
  // ただし、編集権限がない場合やtaskがない場合、SignalR初期化開始前はステータスチェックを待つ必要がない
  // 編集権限: タスク担当者、アイテム担当者、アイテムコミッター、アイテムオーナー
  const isPendingStatusCheck = useMemo(() => {
    // SignalR初期化が開始されていない場合はローディング表示しない
    if (!signalRInitStarted) {
      return false;
    }
    if (!task || !currentUser || taskEditStatusFetched || connectionState !== 'connected') {
      return false;
    }
    const userId = currentUser.id;
    // 編集権限があるユーザーのみステータスチェックを待つ
    const canEdit =
      task.assigned?.id === userId ||
      (task.itemAssignee?.id != null && task.itemAssignee?.id === userId) ||
      (task.itemCommitter?.id != null && task.itemCommitter?.id === userId) ||
      (task.itemOwner?.id != null && task.itemOwner?.id === userId);
    return canEdit;
  }, [signalRInitStarted, task, currentUser, taskEditStatusFetched, connectionState]);

  // SignalRイベントによる状態変更ハンドラー
  // task:edit_ended を受け取った時にロック取得を試行
  const handleStatusChange = useCallback(
    async (newStatus: TaskEditStatusType) => {
      const targetTaskId = task?.id;
      if (!targetTaskId) {
        setTaskEditStatus(newStatus);
        return;
      }

      // 自分がすでにロックを持っている場合は、状態変更を無視
      if (startedTaskEditRef.current === targetTaskId) {
        // ただし、他ユーザーからの edit_started イベントは無視
        // （自分がロックを持っているので、状態は変わらない）
        return;
      }

      // 編集終了イベント（isEditing: false）の場合、ロック取得を試行
      if (!newStatus.isEditing) {
        const { startTaskEdit: start, getTaskEditStatus: getStatus } = signalRRef.current;
        try {
          await start(targetTaskId);
          startedTaskEditRef.current = targetTaskId;
          // ロック取得成功 → 編集可能
          setTaskEditStatus({ isEditing: false });
        } catch {
          // ロック取得失敗 → 他のユーザーが先にロックを取得した
          try {
            const status = await getStatus(targetTaskId);
            setTaskEditStatus(status);
          } catch {
            setTaskEditStatus({ isEditing: true, editor: undefined });
          }
        }
      } else {
        // 編集開始イベント（isEditing: true）→ そのまま状態を設定
        setTaskEditStatus(newStatus);
      }
    },
    [task?.id],
  );

  // 接続断・再接続時はステータス取得完了フラグをリセット
  useEffect(() => {
    if (connectionState !== 'connected') {
      setTaskEditStatusFetched(false);
    }
  }, [connectionState]);

  // タスクデータをフォーム状態に反映
  const syncTaskToForm = useCallback((taskData: WorkspaceTaskDetailResponse) => {
    // 担当者
    if (taskData.assigned?.id) {
      setSelectedAssignee({
        id: taskData.assigned.id,
        username: taskData.assigned.username || '',
        email: '',
        identityIconUrl: taskData.assigned.identityIconUrl || null,
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

    // 先行タスク（配列）
    setPredecessorTaskIds(taskData.predecessorTaskIds || []);
  }, []);

  // タスクと先行タスク候補を並列で取得
  const fetchTask = useCallback(
    async (targetTaskId: number) => {
      setIsLoadingTask(true);
      setServerErrors([]);

      try {
        // タスクデータ、先行タスク候補、未通知バッジを並列で取得
        const [taskResult, predecessorResult, achievementResult] = await Promise.all([
          getWorkspaceTask(workspaceId, itemId, targetTaskId),
          getPredecessorTaskOptions(workspaceId, itemId, targetTaskId),
          getUnnotifiedAchievements(),
        ]);

        if (taskResult.success) {
          setTask(taskResult.data);
          syncTaskToForm(taskResult.data);
        } else {
          notifyRef.current.error(taskResult.message || 'タスクの取得に失敗しました');
        }

        if (predecessorResult.success) {
          setPredecessorTaskOptions(predecessorResult.data || []);
        }

        // 未通知バッジがあれば演出を表示
        console.log('[Achievement] unnotified badges:', achievementResult);
        if (achievementResult.success && achievementResult.data && achievementResult.data.length > 0) {
          console.log('[Achievement] showing celebration for', achievementResult.data.length, 'badges');
          showCelebration(achievementResult.data);
          // 通知済みにマーク
          await markAllAchievementsNotified();
        }
      } catch {
        notifyRef.current.error('タスクの取得中にエラーが発生しました');
      } finally {
        setIsLoadingTask(false);
      }
    },
    [workspaceId, itemId, syncTaskToForm, showCelebration],
  );

  // 初期化
  useEffect(() => {
    if (initialNavigation) {
      setNavigation(initialNavigation);
      const currentTask = initialNavigation.tasks[initialNavigation.currentIndex];
      if (currentTask) {
        // initialNavigationがある場合もfetchTaskで先行タスク候補を含めて取得
        fetchTask(currentTask.id);
        return;
      }
    }

    // タスクID指定で単体読み込み
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId, workspaceId, itemId, initialNavigation, fetchTask]);

  // タスクが変わったときに添付ファイル一覧を取得
  useEffect(() => {
    const loadAttachments = async () => {
      if (!task?.id) {
        setTaskAttachments([]);
        setAttachmentCount(0);
        return;
      }
      const result = await fetchWorkspaceItemAttachments(workspaceId, itemId, task.id);
      if (result.success) {
        setTaskAttachments(result.data);
        setAttachmentCount(result.data.length);
      }
    };
    loadAttachments();
  }, [workspaceId, itemId, task?.id]);

  // タスク変更時に編集状態をリセット
  useEffect(() => {
    const currentId = task?.id ?? null;
    if (prevTaskIdRef.current === currentId) {
      return;
    }
    prevTaskIdRef.current = currentId;
    setTaskEditStatus({ isEditing: false });
    setTaskEditStatusFetched(false);
    setSignalRInitStarted(false); // SignalR初期化開始フラグもリセット
    startedTaskEditRef.current = null;
  }, [task?.id]);

  // SignalR: タスクグループ参加 → 編集開始を1つのフローで実行
  // joinTask後に即座にstartTaskEditを呼び、ロック取得を試行する
  useEffect(() => {
    const targetTaskId = task?.id;
    if (!targetTaskId) return;
    if (connectionState !== 'connected') return;

    let active = true;
    let hasStartedEdit = false;

    // SignalR初期化開始フラグを設定（編集権限がある場合のみローディング表示）
    setSignalRInitStarted(true);

    const initializeTaskEdit = async () => {
      const { joinTask: join, startTaskEdit: start } = signalRRef.current;
      try {
        // 1. タスクグループに参加（編集状態も含めて返ってくる）
        const joinResult = await join(targetTaskId, workspaceId, itemId);
        if (!active) return;

        // 2. 編集権限がない場合は、編集状態を気にせずスキップ（保存ボタンが押せないため）
        if (!hasEditPermissionRef.current) {
          setTaskEditStatus({ isEditing: false });
          setTaskEditStatusFetched(true);
          return;
        }

        // 3. joinTask の結果で既に他者が編集中なら、即座にロック状態を表示
        if (
          joinResult.editStatus?.isEditing &&
          joinResult.editStatus.editor?.userId !== effectiveCurrentUserIdRef.current
        ) {
          setTaskEditStatus(joinResult.editStatus);
          setTaskEditStatusFetched(true);
          return;
        }

        // 4. 編集開始を試行（ロック取得）
        try {
          await start(targetTaskId);
          if (!active) return;
          hasStartedEdit = true;
          startedTaskEditRef.current = targetTaskId;
          // 自分がこのタブでロック取得成功 → 編集可能、アラート不要
          setTaskEditStatus({ isEditing: false });
          setTaskEditStatusFetched(true);
        } catch {
          // ロック取得失敗 → 他のユーザーまたは別タブが編集中
          if (!active) return;
          // joinResult の editStatus を使用（追加のAPI呼び出し不要）
          if (joinResult.editStatus?.isEditing) {
            setTaskEditStatus(joinResult.editStatus);
          } else {
            // フォールバック: ロック中として扱う
            setTaskEditStatus({ isEditing: true, editor: undefined });
          }
          setTaskEditStatusFetched(true);
        }
      } catch (err) {
        console.warn('[SignalR] initializeTaskEdit failed:', err);
        if (active) {
          setTaskEditStatusFetched(true);
        }
      }
    };

    initializeTaskEdit();

    // task:edit_started / task:edit_ended イベントを購読
    const { onTaskEditStarted: onStart, onTaskEditEnded: onEnd } = signalRRef.current;
    const unsubStart = onStart((payload) => {
      if (payload.taskId !== targetTaskId) return;
      // 自分がすでにロックを持っている場合は無視
      if (startedTaskEditRef.current === targetTaskId) return;
      // 編集権限がない場合は編集状態通知を無視（保存ボタンが押せないため）
      if (!hasEditPermissionRef.current) return;
      setTaskEditStatus({
        isEditing: true,
        editor: {
          userId: payload.userId,
          userName: payload.userName ?? '',
          identityIconUrl: payload.identityIconUrl ?? null,
        },
      });
    });

    const unsubEnd = onEnd((payload) => {
      if (payload.taskId !== targetTaskId) return;
      // 自分がすでにロックを持っている場合は無視
      if (startedTaskEditRef.current === targetTaskId) return;
      // 編集権限がない場合は編集状態通知を無視（保存ボタンが押せないため）
      if (!hasEditPermissionRef.current) return;
      // 編集終了 → handleStatusChangeを呼んでロック取得を試行
      handleStatusChange({ isEditing: false });
    });

    return () => {
      active = false;
      unsubStart();
      unsubEnd();
      // クリーンアップ: 編集終了とグループ離脱
      const { endTaskEdit: end, leaveTask: leave } = signalRRef.current;
      if (hasStartedEdit && startedTaskEditRef.current === targetTaskId) {
        end(targetTaskId).catch((err) => console.warn('[SignalR] endTaskEdit failed', err));
        startedTaskEditRef.current = null;
      }
      leave(targetTaskId).catch((err) => console.warn('[SignalR] leaveTask failed:', err));
    };
  }, [connectionState, handleStatusChange, itemId, task?.id, workspaceId]);

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
      schema: taskSchema,
      onSubmit: async (data) => {
        if (!task) return;
        setServerErrors([]);

        // ワークスペース編集権限チェック
        if (!canEdit) {
          notifyRef.current.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
          return;
        }

        if (isLockedByOther) {
          notifyRef.current.warning('他のユーザーが編集中です。編集できません。');
          return;
        }

        // 日付を ISO 8601 形式（UTC）に変換
        const toISODateString = (dateStr: string | undefined | null): string | null => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          return date.toISOString();
        };

        const requestData: UpdateWorkspaceTaskRequest = {
          content: data.content,
          taskTypeId: data.taskTypeId,
          assignedUserId: data.assignedUserId,
          priority: data.priority as TaskPriority | undefined,
          startDate: toISODateString(data.startDate),
          dueDate: toISODateString(data.dueDate)!,
          estimatedHours: data.estimatedHours || null,
          actualHours: data.actualHours || null,
          progressPercentage: data.progressPercentage ?? 0,
          isCompleted: data.isCompleted || false,
          isDiscarded: data.isDiscarded || false,
          discardReason: data.isDiscarded ? data.discardReason : null,
          predecessorTaskIds: predecessorTaskIds.length > 0 ? predecessorTaskIds : undefined,
          clearPredecessorTasks: predecessorTaskIds.length === 0 && (task.predecessorTaskIds?.length ?? 0) > 0,
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
          const errorMessage = result.message || 'タスクの更新に失敗しました';
          setServerErrors([{ key: 0, message: errorMessage }]);
          notifyRef.current.error(errorMessage);
          return;
        }

        // バッジ取得演出を表示（newAchievementsがある場合）
        if (result.data?.newAchievements && result.data.newAchievements.length > 0) {
          showCelebration(result.data.newAchievements);
        }

        notifyRef.current.success('タスクを更新しました');

        // 更新後、最新データを取得してフォームに反映
        await fetchTask(task.id);
        onSuccess();
      },
    });

  // 編集権限チェック: タスク担当者、アイテム担当者、アイテムコミッター、アイテムオーナーのみ編集可能
  // ※権限情報はAPIレスポンス（task）から取得する（propsは表示用のみ）
  const hasEditPermission = useMemo(() => {
    if (!currentUser || !task) return false;
    const userId = currentUser.id;

    // タスク担当者
    if (task.assigned?.id === userId) return true;
    // アイテム担当者（APIレスポンスから取得）
    if (task.itemAssignee?.id != null && task.itemAssignee?.id === userId) return true;
    // アイテムコミッター（APIレスポンスから取得）
    if (task.itemCommitter?.id != null && task.itemCommitter?.id === userId) return true;
    // アイテムオーナー（APIレスポンスから取得）
    if (task.itemOwner?.id != null && task.itemOwner?.id === userId) return true;

    return false;
  }, [currentUser, task]);

  // refに権限状態を反映（useEffect内で参照するため）
  hasEditPermissionRef.current = hasEditPermission;

  const isFormDisabled = isSubmitting || isLoadingTask || isLockedByOther || isPendingStatusCheck || !hasEditPermission;

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

  // ページ離脱時の状態リセット処理（resetFormをuseEffect外で呼ぶ必要がない場合はコメントアウト可）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _resetFormRef = resetForm;

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
  }, [canGoPrev, canGoNext, handlePrevTask, handleNextTask, onClose]);

  return (
    <div className="card">
      <div className="card-body">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="icon-[mdi--clipboard-text-outline] size-6" aria-hidden="true" />
              タスク詳細
              {task?.sequence && workspaceCode && itemCode && (
                <button
                  type="button"
                  onClick={() => {
                    const refText = `${workspaceCode}#${itemCode}T${task.sequence}`;
                    navigator.clipboard.writeText(refText);
                    notify.success(`${refText} をコピーしました`);
                  }}
                  className="text-base-content/70 font-mono hover:text-primary cursor-pointer transition-colors"
                  title="クリックして参照コードをコピー"
                >
                  T-{task.sequence}
                </button>
              )}
            </h2>
            {/* ナビゲーションインジケーター */}
            {showNavigationControls && navigation && navigation.totalCount > 1 && (canGoPrev || canGoNext) && (
              <span className="text-sm text-base-content/60">
                {currentPosition} / {navigation.totalCount}
              </span>
            )}
            {/* コミッター表示 */}
            <div className="flex items-center gap-2 text-sm text-base-content/70 border-l border-base-300 pl-4">
              <span className="text-base-content/50">コミッター:</span>
              {itemCommitterName ? (
                <UserAvatar
                  userName={itemCommitterName}
                  isActive={itemCommitterIsActive ?? false}
                  identityIconUrl={itemCommitterAvatarUrl}
                  size={20}
                  nameClassName="font-medium"
                />
              ) : (
                <span className="text-base-content/50 italic">未設定</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* アジェンダ作成ボタン */}
            <Link
              href="/agendas/new"
              target="_blank"
              className="btn btn-outline btn-sm gap-1"
              title="新規イベントを作成（別タブで開きます）"
            >
              <span className="icon-[mdi--calendar-plus] size-4" aria-hidden="true" />
              イベント作成
            </Link>
            {/* 添付ファイルボタン */}
            {task && (
              <button
                type="button"
                className="btn btn-outline btn-sm gap-1"
                onClick={() => setIsAttachmentModalOpen(true)}
                disabled={isLoadingTask || isSubmitting}
                title="添付ファイル"
              >
                <span className="icon-[mdi--paperclip] size-4" aria-hidden="true" />
                添付
                {attachmentCount > 0 && <span className="badge badge-secondary badge-sm">{attachmentCount}</span>}
              </button>
            )}
            {/* フローボタン */}
            {onShowFlowMap && (
              <button
                type="button"
                className="btn btn-outline btn-success btn-sm gap-1"
                onClick={onShowFlowMap}
                disabled={isLoadingTask || isSubmitting}
                title="タスクフローマップを表示"
              >
                <span className="icon-[mdi--sitemap] size-4" aria-hidden="true" />
                フロー
              </button>
            )}
            {showNavigationControls && (canGoPrev || canGoNext) && (
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
            {/* 戻る/閉じるボタン */}
            {isModal ? (
              <button
                type="button"
                className="btn btn-sm btn-secondary btn-circle"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="閉じる"
              >
                <span className="icon-[mdi--close] size-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-secondary gap-2"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="アイテム詳細に戻る"
              >
                <span className="icon-[mdi--arrow-left] size-5" aria-hidden="true" />
                アイテム
              </button>
            )}
          </div>
        </div>

        {/* コンテンツ - サイドバイサイドレイアウト */}
        <div className="flex flex-col lg:flex-row flex-1 gap-4 min-h-0">
          {/* 左パネル：編集フォーム */}
          <div className="flex-1 min-w-0">
            {isLoadingTask && !task ? (
              <div className="flex justify-center items-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : !task ? (
              <EmptyState iconClass="icon-[mdi--clipboard-alert-outline]" message="タスクが見つかりません" size="sm" />
            ) : (
              <>
                {/* ローディングオーバーレイ（タスク切り替え時のみ表示） */}
                {isLoadingTask && (
                  <div className="absolute inset-0 bg-base-100/60 flex items-center justify-center z-10 pointer-events-none">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                )}

                {/* 他ユーザー編集中のブロッカー */}
                {isLockedByOther && (
                  <div className="absolute inset-0 z-20 bg-base-100/70 flex flex-col items-center justify-center gap-3">
                    <div className="alert alert-soft alert-info shadow-md w-full max-w-xl">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="icon-[mdi--information] w-5 h-5" aria-hidden="true" />
                          <span>{taskEditStatus.editor?.userName ?? '誰か'} さんが編集中です</span>
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="btn btn-sm btn-secondary btn-circle"
                          aria-label="閉じる"
                        >
                          <span className="icon-[mdi--close] w-5 h-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* フォーム */}
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 relative" noValidate>
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
                        disabled={isFormDisabled}
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
                        value={priority ?? ''}
                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        disabled={isFormDisabled}
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
                        <button
                          type="button"
                          className="link link-primary text-xs"
                          onClick={handleSelectSelf}
                          disabled={isFormDisabled}
                        >
                          （自分を設定）
                        </button>
                      )}
                    </div>
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
                          disabled={isFormDisabled}
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
                          inputRef={assigneeSearchInputRef}
                          onSearch={handleAssigneeSearch}
                          placeholder="名前で検索..."
                          debounceMs={300}
                          size="md"
                          isLoading={isSearchingAssignee}
                          disabled={isFormDisabled}
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
                    <label htmlFor="content" className="label">
                      <span className="label-text font-semibold">
                        タスク内容 <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      id="content"
                      data-field="content"
                      placeholder="タスクは、単純かつ具体的で達成可能な内容を入力にします..."
                      className={`textarea textarea-bordered h-24 ${shouldShowError('content') ? 'textarea-error' : ''}`}
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        if (shouldShowError('content')) {
                          validateField('content', e.target.value);
                        }
                      }}
                      onBlur={(e) => validateField('content', e.target.value)}
                      disabled={isFormDisabled}
                    />
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
                        disabled={isFormDisabled}
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
                        disabled={isFormDisabled}
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
                      {(() => {
                        // 選択中の先行タスクへのリンクを表示（最初の1件のみ）
                        if (predecessorTaskIds.length > 0 && onNavigateToTask) {
                          const firstPredId = predecessorTaskIds[0];
                          const selectedPredecessor = predecessorTaskOptions.find((t) => t.id === firstPredId);
                          const predecessorSequence =
                            selectedPredecessor?.sequence ??
                            task?.predecessorTasks?.find((p) => p.id === firstPredId)?.sequence;
                          if (predecessorSequence) {
                            return (
                              <button
                                type="button"
                                className="link link-primary text-sm ml-2"
                                onClick={() => onNavigateToTask(predecessorSequence)}
                                title={`先行タスク T-${predecessorSequence} を表示`}
                              >
                                T-{predecessorSequence} を表示
                                {predecessorTaskIds.length > 1 && ` (他${predecessorTaskIds.length - 1}件)`}
                              </button>
                            );
                          }
                        }
                        return null;
                      })()}
                      <span className="label-text-alt text-base-content/60">
                        （これらのタスクが完了しないと着手できない・複数選択可）
                      </span>
                    </label>
                    <div
                      id="predecessorTaskIds"
                      className="border border-base-300 rounded-lg p-2 max-h-48 overflow-y-auto bg-base-100"
                    >
                      {predecessorTaskOptions.length === 0 ? (
                        <p className="text-base-content/60 text-sm py-2 text-center">選択可能なタスクがありません</p>
                      ) : (
                        <div className="space-y-1">
                          {predecessorTaskOptions.map((t) => (
                            <label
                              key={t.id}
                              className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-base-200 transition-colors ${
                                predecessorTaskIds.includes(t.id) ? 'bg-primary/10' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-primary mt-0.5"
                                checked={predecessorTaskIds.includes(t.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPredecessorTaskIds([...predecessorTaskIds, t.id]);
                                  } else {
                                    setPredecessorTaskIds(predecessorTaskIds.filter((id) => id !== t.id));
                                  }
                                }}
                                disabled={isFormDisabled}
                              />
                              <span className={`text-sm flex-1 ${t.isCompleted ? 'line-through text-base-content/50' : ''}`}>
                                T-{t.sequence}: {t.content.length > 50 ? `${t.content.substring(0, 50)}...` : t.content}
                                {t.isCompleted && <span className="ml-1 badge badge-sm badge-success">完了</span>}
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
                            disabled={isFormDisabled}
                          >
                            クリア
                          </button>
                        </span>
                      </div>
                    )}
                    {predecessorDueDateWarnings.length > 0 && (
                      <div className="label flex-col items-start">
                        {predecessorDueDateWarnings.map((warning) => (
                          <span key={warning} className="label-text-alt text-warning flex items-start gap-1">
                            <span
                              className="icon-[mdi--alert-circle-outline] size-4 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <span>{warning}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 工数（予定・実績）を横並び */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        className={`input input-bordered flex items-center ${shouldShowError('estimatedHours') ? 'input-error' : ''}`}
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
                          disabled={isFormDisabled}
                          aria-label="予定工数入力"
                        />
                        <span className="my-auto flex gap-2">
                          <button
                            type="button"
                            className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                            aria-label="0.5時間減らす"
                            onClick={() => setEstimatedHours((prev) => Math.max(0, (prev || 0) - 0.5))}
                            disabled={isFormDisabled || estimatedHours <= 0}
                          >
                            <span className="icon-[mdi--minus-circle-outline] size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                            aria-label="0.5時間増やす"
                            onClick={() => setEstimatedHours((prev) => (prev || 0) + 0.5)}
                            disabled={isFormDisabled}
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
                          disabled={isFormDisabled}
                          aria-label="実績工数入力"
                        />
                        <span className="my-auto flex gap-2">
                          <button
                            type="button"
                            className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                            aria-label="0.5時間減らす"
                            onClick={() => setActualHours((prev) => Math.max(0, (prev || 0) - 0.5))}
                            disabled={isFormDisabled || actualHours <= 0}
                          >
                            <span className="icon-[mdi--minus-circle-outline] size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-soft size-6 min-h-0 rounded-sm p-0"
                            aria-label="0.5時間増やす"
                            onClick={() => setActualHours((prev) => (prev || 0) + 0.5)}
                            disabled={isFormDisabled}
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
                      disabled={isFormDisabled}
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
                          data-field="isCompleted"
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
                            isFormDisabled ||
                            (task?.itemCommitter?.id != null &&
                              currentUser?.id !== task.itemCommitter?.id &&
                              currentUser?.id !== task.itemAssignee?.id &&
                              currentUser?.id !== task.itemOwner?.id) ||
                            (enforcePredecessorCompletion && isPredecessorIncomplete)
                          }
                          title={
                            enforcePredecessorCompletion && isPredecessorIncomplete
                              ? '先行タスクが完了していないため、完了にできません'
                              : task?.itemCommitter?.id != null &&
                                  currentUser?.id !== task.itemCommitter?.id &&
                                  currentUser?.id !== task.itemAssignee?.id &&
                                  currentUser?.id !== task.itemOwner?.id
                                ? '完了操作はコミッター、アイテム担当者、またはオーナーのみ可能です'
                                : undefined
                          }
                        />
                        <label htmlFor="isCompleted" className="label-text cursor-pointer">
                          完了
                          {task?.itemCommitter?.id != null &&
                            currentUser?.id !== task.itemCommitter?.id &&
                            currentUser?.id !== task.itemAssignee?.id &&
                            currentUser?.id !== task.itemOwner?.id && (
                              <span className="text-xs text-base-content/50 ml-1">
                                (コミッター/担当者/オーナーのみ)
                              </span>
                            )}
                          {enforcePredecessorCompletion && isPredecessorIncomplete && (
                            <span className="text-xs text-warning ml-1">(先行タスク未完了)</span>
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
                          data-field="isDiscarded"
                          className="switch switch-outline switch-warning"
                          checked={isDiscarded}
                          onChange={(e) => {
                            setIsDiscarded(e.target.checked);
                            if (e.target.checked) {
                              setIsCompleted(false);
                            }
                          }}
                          disabled={isFormDisabled}
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
                        data-field="discardReason"
                        placeholder="破棄の理由を入力してください..."
                        className={`textarea textarea-bordered h-20 ${shouldShowError('discardReason') ? 'textarea-error' : ''}`}
                        value={discardReason}
                        onChange={(e) => setDiscardReason(e.target.value)}
                        onBlur={(e) => validateField('discardReason', e.target.value)}
                        disabled={isFormDisabled}
                        required
                      />
                      {shouldShowError('discardReason') && (
                        <div className="label">
                          <span className="label-text-alt text-error">{getFieldError('discardReason')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* メタ情報（作成者・完了者・更新日時） */}
                  <div className="border-t border-base-300 pt-4 mt-4">
                    <div className="flex flex-wrap gap-4 text-sm text-base-content/60">
                      {task.createdBy?.id && (
                        <div className="flex items-center gap-2">
                          <span>作成者:</span>
                          <UserAvatar
                            userName={task.createdBy.username}
                            isActive={task.createdBy.isActive ?? false}
                            identityIconUrl={task.createdBy.identityIconUrl}
                            size={20}
                            nameClassName=""
                          />
                        </div>
                      )}
                      {task.createdAt && <div>作成日時: {formatDateTime(task.createdAt)}</div>}
                      {task.isCompleted && task.completedBy?.id && (
                        <div className="flex items-center gap-2 text-success">
                          <span className="icon-[mdi--check-circle] w-4 h-4" aria-hidden="true" />
                          <span>完了者:</span>
                          <UserAvatar
                            userName={task.completedBy.username}
                            isActive={task.completedBy.isActive ?? false}
                            identityIconUrl={task.completedBy.identityIconUrl}
                            size={20}
                            nameClassName="text-success"
                          />
                        </div>
                      )}
                      {task.updatedAt && <div>更新日時: {formatDateTime(task.updatedAt)}</div>}
                    </div>
                  </div>

                  {/* サーバーエラー表示 */}
                  {serverErrors.length > 0 && (
                    <div className="alert alert-soft alert-error">
                      <span className="icon-[mdi--alert-circle] size-6 shrink-0" aria-hidden="true" />
                      <div>
                        <h3 className="font-bold">エラーが発生しました</h3>
                        <ul className="list-disc list-inside mt-1">
                          {serverErrors.map((error) => (
                            <li key={error.key}>{error.message}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ボタングループ */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={onClose}
                      disabled={isSubmitting || isLoadingTask}
                    >
                      閉じる
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isFormDisabled}>
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
          <div className="w-full lg:w-1/2 flex-shrink-0 flex flex-col bg-base-200/30 rounded-lg">
            {task && (
              <TaskCommentSection
                workspaceId={workspaceId}
                itemId={itemId}
                taskId={task.id}
                autoFocus={initialFocusComments}
                canEdit={canEdit}
                taskAssigneeId={task.assigned?.id}
                itemOwnerId={task.itemOwner?.id}
                itemAssigneeId={task.itemAssignee?.id}
                itemCommitterId={task.itemCommitter?.id}
              />
            )}
          </div>
        </div>

        {/* 添付ファイルモーダル */}
        {task && (
          <ItemAttachmentModal
            isOpen={isAttachmentModalOpen}
            onClose={() => setIsAttachmentModalOpen(false)}
            workspaceId={workspaceId}
            itemId={itemId}
            taskId={task.id}
            initialAttachments={taskAttachments}
            canEdit={hasEditPermission && !isLockedByOther}
            currentUserId={currentUser?.id ?? 0}
            itemOwnerId={task.itemOwner?.id ?? undefined}
            onAttachmentCountChange={setAttachmentCount}
          />
        )}
      </div>
    </div>
  );
}
