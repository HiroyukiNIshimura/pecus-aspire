'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUsersWorkload } from '@/actions/admin/user';
import { fetchWorkspaceMembers } from '@/actions/agenda';
import { searchWorkspaceMembers } from '@/actions/workspace';
import type { PredecessorTaskOption } from '@/actions/workspaceTask';
import { bulkCreateTasks, generateTaskCandidates, getPredecessorTaskOptions } from '@/actions/workspaceTask';
import DatePicker from '@/components/common/filters/DatePicker';
import DebouncedSearchInput from '@/components/common/filters/DebouncedSearchInput';
import AiProgressOverlay from '@/components/common/overlays/AiProgressOverlay';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import WorkloadIndicator from '@/components/common/widgets/user/WorkloadIndicator';
import TaskTypeSelect, { type TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import type {
  BulkTaskItem,
  EstimatedSize,
  GeneratedTaskCandidate,
  PreviousCandidateRequest,
  TaskGenerationResponse,
  TaskPriority,
  UserSearchResultResponse,
  UserWorkloadInfo,
} from '@/connectors/api/pecus';
import { useAiSuggestion } from '@/hooks/useAiSuggestion';
import { useNotify } from '@/hooks/useNotify';
import { useIsAiEnabled } from '@/providers/AppSettingsProvider';

/** 選択されたユーザー情報 */
interface SelectedUser {
  id: number;
  username: string;
  email: string;
  identityIconUrl: string | null;
}

/** 編集可能なタスク候補（フロントエンド管理用） */
interface EditableTaskCandidate extends GeneratedTaskCandidate {
  /** 選択状態 */
  isSelected: boolean;
  /** 担当者 */
  assignee: SelectedUser | null;
  /** 優先度 */
  priority: TaskPriority | null;
  /** 期限日（ISO形式） */
  dueDate: string;
  /** 開始日（ISO形式） */
  startDate: string | null;
  /** 工数（人間が入力） */
  estimatedHours: number | null;
  /** タスクタイプID（編集後） */
  taskTypeId: number | null;
  /** 先行タスクID配列（既存タスク）*/
  predecessorTaskIds: number[];
  /** 同一バッチ内の先行タスクtempId配列 */
  predecessorTempIds: string[];
}

interface GenerateTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: number;
  itemId: number;
  /** アイテムの期限日（デフォルト値用） */
  itemDueDate?: string | null;
  /** タスクタイプマスタデータ */
  taskTypes: TaskTypeOption[];
  /** 現在ログイン中のユーザー */
  currentUser?: {
    id: number;
    username: string;
    email: string;
    identityIconUrl: string | null;
  } | null;
  /** ワークスペース編集権限があるかどうか */
  canEdit?: boolean;
}

/** 規模感のラベルと説明 */
const sizeLabels: Record<EstimatedSize, { label: string; description: string; className: string }> = {
  S: { label: 'S', description: '〜4時間', className: 'badge-success' },
  M: { label: 'M', description: '〜8時間', className: 'badge-info' },
  L: { label: 'L', description: '〜24時間', className: 'badge-warning' },
  XL: { label: 'XL', description: '〜40時間', className: 'badge-error' },
};

export default function GenerateTasksModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
  itemId,
  itemDueDate,
  taskTypes,
  currentUser,
  canEdit = true,
}: GenerateTasksModalProps) {
  const notify = useNotify();
  const isAiEnabled = useIsAiEnabled();

  // ステップ管理: 'input' | 'result'
  const [step, setStep] = useState<'input' | 'result'>('input');

  // 入力フォーム状態
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  // 生成状態
  const {
    isLoading: isGenerating,
    startLoading: startGenerating,
    finishLoading: finishGenerating,
    cancel: cancelGenerating,
    checkCancelled: checkGeneratingCancelled,
  } = useAiSuggestion();
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationResponse, setGenerationResponse] = useState<TaskGenerationResponse | null>(null);
  const [candidates, setCandidates] = useState<EditableTaskCandidate[]>([]);

  // 作成状態
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 先行タスク候補（既存タスク）
  const [predecessorTaskOptions, setPredecessorTaskOptions] = useState<PredecessorTaskOption[]>([]);

  // 展開されているタスク候補のtempId
  const [expandedTempId, setExpandedTempId] = useState<string | null>(null);

  // 担当者検索関連（個別タスク用）
  const [assigneeSearchResults, setAssigneeSearchResults] = useState<UserSearchResultResponse[]>([]);
  const [isSearchingAssignee, setIsSearchingAssignee] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [editingAssigneeTempId, setEditingAssigneeTempId] = useState<string | null>(null);

  // ワークスペースメンバー一覧（AI担当者推薦の解決用）
  const [workspaceMembers, setWorkspaceMembers] = useState<
    { userId: number; userName: string; email: string; identityIconUrl: string | null }[]
  >([]);

  // 担当者の負荷情報
  const [workloadMap, setWorkloadMap] = useState<Record<string, UserWorkloadInfo>>({});

  // 開始日のデフォルト値として今日を設定
  useEffect(() => {
    if (isOpen && !startDate) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
    }
    if (isOpen && !endDate && itemDueDate) {
      // ISO形式からyyyy-MM-ddを抽出
      const dueDate = itemDueDate.split('T')[0];
      setEndDate(dueDate);
    }
  }, [isOpen, startDate, endDate, itemDueDate]);

  // モーダルが開いたら先行タスク候補とメンバー一覧を取得
  useEffect(() => {
    if (isOpen) {
      (async () => {
        const result = await getPredecessorTaskOptions({ workspaceId, itemId });
        if (result.success) {
          setPredecessorTaskOptions(result.data || []);
        }
      })();
      // メンバー一覧を取得（AI担当者推薦の解決用）
      (async () => {
        const result = await fetchWorkspaceMembers(workspaceId);
        if (result.success) {
          setWorkspaceMembers(result.data || []);
        }
      })();
    }
  }, [isOpen, workspaceId, itemId]);

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 候補の担当者が変更されたら負荷情報を取得
  useEffect(() => {
    if (candidates.length === 0) {
      setWorkloadMap({});
      return;
    }

    const fetchWorkload = async () => {
      // 候補から担当者IDを抽出（重複除去）
      const assigneeIds = [...new Set(candidates.filter((c) => c.assignee?.id).map((c) => c.assignee!.id))];
      if (assigneeIds.length === 0) {
        setWorkloadMap({});
        return;
      }

      const result = await getUsersWorkload(assigneeIds);
      if (result.success && result.data?.workloads) {
        setWorkloadMap(result.data.workloads);
      }
    };

    fetchWorkload();
  }, [candidates]);

  // モーダルを閉じる際のリセット
  const handleClose = useCallback(() => {
    setStep('input');
    setStartDate('');
    setEndDate('');
    setAdditionalContext('');
    setFeedback('');
    setGenerationError(null);
    setGenerationResponse(null);
    setCandidates([]);
    setWorkloadMap({});
    setIsCreating(false);
    setCreateError(null);
    setExpandedTempId(null);
    onClose();
  }, [onClose]);

  // AI生成されたタスク候補を編集可能な形式に変換
  const convertToEditableCandidates = useCallback(
    (response: TaskGenerationResponse): EditableTaskCandidate[] => {
      // 開始日から期限日を計算
      const baseDate = new Date(startDate);

      return response.candidates.map((candidate) => {
        // 推奨期間から期限日を計算
        const suggestedDueDate = new Date(baseDate);
        suggestedDueDate.setDate(
          baseDate.getDate() + (candidate.suggestedStartDayOffset || 0) + (candidate.suggestedDurationDays || 1),
        );

        // 推奨開始日を計算
        const suggestedStartDate = new Date(baseDate);
        suggestedStartDate.setDate(baseDate.getDate() + (candidate.suggestedStartDayOffset || 0));

        // 先行タスクの解決（AIが返したtempId配列をそのまま保持）
        const predecessorTempIds = candidate.predecessorTempIds || [];

        // AI推薦の担当者IDからユーザー情報を解決
        let assignee: SelectedUser | null = null;
        if (candidate.suggestedAssigneeId) {
          const member = workspaceMembers.find((m) => m.userId === candidate.suggestedAssigneeId);
          if (member) {
            assignee = {
              id: member.userId,
              username: member.userName,
              email: member.email,
              identityIconUrl: member.identityIconUrl,
            };
          }
        }
        // フォールバック: 担当者が解決できなかった場合は現在のユーザーを設定
        if (!assignee && currentUser) {
          assignee = {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            identityIconUrl: currentUser.identityIconUrl,
          };
        }

        return {
          ...candidate,
          isSelected: true, // デフォルトで選択
          assignee,
          priority: null,
          dueDate: suggestedDueDate.toISOString().split('T')[0],
          startDate: suggestedStartDate.toISOString().split('T')[0],
          estimatedHours: null,
          taskTypeId: candidate.suggestedTaskTypeId || null,
          predecessorTaskIds: [],
          predecessorTempIds,
        };
      });
    },
    [startDate, currentUser, workspaceMembers],
  );

  // タスク候補を生成
  const handleGenerate = useCallback(async () => {
    if (!startDate) {
      notify.warning('開始日を入力してください');
      return;
    }

    startGenerating();
    setGenerationError(null);

    // 前回の候補がある場合はイテレーション用に渡す
    const previousCandidates: PreviousCandidateRequest[] | undefined =
      candidates.length > 0
        ? candidates.map((c) => ({
            content: c.content,
            isAccepted: c.isSelected,
            rejectionReason: c.isSelected ? undefined : '不採用',
          }))
        : undefined;

    const result = await generateTaskCandidates({
      workspaceId,
      itemId,
      request: {
        startDate,
        endDate: endDate || undefined,
        additionalContext: additionalContext || undefined,
        feedback: feedback || undefined,
        previousCandidates,
      },
    });

    // キャンセルされていた場合は結果を無視
    if (checkGeneratingCancelled()) return;

    if (result.success) {
      setGenerationResponse(result.data);
      setCandidates(convertToEditableCandidates(result.data));
      setStep('result');
      setFeedback(''); // フィードバックをクリア
    } else {
      setGenerationError(result.message);
    }

    finishGenerating();
  }, [
    startDate,
    endDate,
    additionalContext,
    feedback,
    candidates,
    workspaceId,
    itemId,
    notify,
    convertToEditableCandidates,
    startGenerating,
    finishGenerating,
    checkGeneratingCancelled,
  ]);

  // タスク候補の選択状態をトグル
  const toggleCandidateSelection = useCallback((tempId: string) => {
    setCandidates((prev) => prev.map((c) => (c.tempId === tempId ? { ...c, isSelected: !c.isSelected } : c)));
  }, []);

  // タスク候補を更新
  const updateCandidate = useCallback((tempId: string, updates: Partial<EditableTaskCandidate>) => {
    setCandidates((prev) => prev.map((c) => (c.tempId === tempId ? { ...c, ...updates } : c)));
  }, []);

  // 担当者検索
  const handleAssigneeSearch = useCallback(
    async (query: string, tempId: string) => {
      setEditingAssigneeTempId(tempId);

      if (query.length < 2) {
        setAssigneeSearchResults([]);
        setShowAssigneeDropdown(false);
        return;
      }

      setIsSearchingAssignee(true);
      setShowAssigneeDropdown(true);

      try {
        const result = await searchWorkspaceMembers({ workspaceId, query, excludeViewer: true });
        if (result.success && result.data) {
          setAssigneeSearchResults(result.data);
          // 検索結果のユーザーの負荷情報を取得
          const userIds = result.data.map((u) => u.id).filter((id): id is number => id !== undefined);
          if (userIds.length > 0) {
            const workloadResult = await getUsersWorkload(userIds);
            if (workloadResult.success && workloadResult.data) {
              setWorkloadMap((prev) => ({ ...prev, ...workloadResult.data }));
            }
          }
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
    (user: UserSearchResultResponse, tempId: string) => {
      updateCandidate(tempId, {
        assignee: {
          id: user.id || 0,
          username: user.username || '',
          email: user.email || '',
          identityIconUrl: user.identityIconUrl || null,
        },
      });
      setShowAssigneeDropdown(false);
      setAssigneeSearchResults([]);
      setEditingAssigneeTempId(null);
    },
    [updateCandidate],
  );

  // 全選択/全解除
  const toggleSelectAll = useCallback(() => {
    const allSelected = candidates.every((c) => c.isSelected);
    setCandidates((prev) => prev.map((c) => ({ ...c, isSelected: !allSelected })));
  }, [candidates]);

  // 選択されたタスクを一括作成
  const handleBulkCreate = useCallback(async () => {
    const selectedCandidates = candidates.filter((c) => c.isSelected);

    if (selectedCandidates.length === 0) {
      notify.warning('作成するタスクを1つ以上選択してください');
      return;
    }

    // 担当者未設定のチェック
    const missingAssignee = selectedCandidates.find((c) => !c.assignee);
    if (missingAssignee) {
      notify.warning('すべてのタスクに担当者を設定してください');
      return;
    }

    // タスクタイプ未設定のチェック
    const missingTaskType = selectedCandidates.find((c) => !c.taskTypeId);
    if (missingTaskType) {
      notify.warning('すべてのタスクにタスクタイプを設定してください');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    // tempIdからインデックスへのマップを作成（同一バッチ内の先行タスク解決用）
    const tempIdToIndex = new Map<string, number>();
    selectedCandidates.forEach((c, index) => {
      tempIdToIndex.set(c.tempId, index);
    });

    // BulkTaskItem配列を作成
    const tasks: BulkTaskItem[] = selectedCandidates.map((c) => {
      // 先行タスクの解決（配列対応）
      const predecessorIndices: number[] = [];
      const predecessorTaskIds: number[] = [];

      // 既存タスクIDの解決
      for (const predTaskId of c.predecessorTaskIds) {
        predecessorTaskIds.push(predTaskId);
      }

      // 同一バッチ内のタスクの解決
      for (const predTempId of c.predecessorTempIds) {
        const index = tempIdToIndex.get(predTempId);
        if (index !== undefined) {
          predecessorIndices.push(index);
        }
      }

      return {
        content: c.content,
        taskTypeId: c.taskTypeId!,
        assignedUserId: c.assignee!.id,
        priority: c.priority || undefined,
        startDate: c.startDate || undefined,
        dueDate: c.dueDate,
        estimatedHours: c.estimatedHours || undefined,
        predecessorTaskIds: predecessorTaskIds.length > 0 ? predecessorTaskIds : undefined,
        predecessorIndices: predecessorIndices.length > 0 ? predecessorIndices : undefined,
      };
    });

    const result = await bulkCreateTasks({ workspaceId, itemId, request: { tasks } });

    if (result.success) {
      notify.success(`${result.data.totalCreated}件のタスクを作成しました`);
      onSuccess();
      handleClose();
    } else {
      setCreateError(result.message);
    }

    setIsCreating(false);
  }, [candidates, workspaceId, itemId, notify, onSuccess, handleClose]);

  // 選択されたタスク数
  const selectedCount = useMemo(() => candidates.filter((c) => c.isSelected).length, [candidates]);

  // 後続タスクマップ（各タスクに依存しているタスクのtempIdリスト）
  const successorMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const candidate of candidates) {
      // predecessorTempIds配列から後続を構築
      for (const predId of candidate.predecessorTempIds) {
        const existing = map.get(predId) || [];
        if (!existing.includes(candidate.tempId)) {
          existing.push(candidate.tempId);
          map.set(predId, existing);
        }
      }
    }
    return map;
  }, [candidates]);

  // tempIdからタスク番号への変換（表示用）
  const tempIdToIndex = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < candidates.length; i++) {
      map.set(candidates[i].tempId, i + 1);
    }
    return map;
  }, [candidates]);

  if (!isOpen) return null;

  // AI機能が無効の場合
  if (!isAiEnabled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-base-100 rounded-box shadow-xl w-full max-w-md p-6">
          <h2 className="text-xl font-bold mb-4">AI タスク自動生成</h2>
          <p className="text-base-content/70">AI機能が有効になっていません。管理者にお問い合わせください。</p>
          <div className="flex justify-end mt-6">
            <button type="button" className="btn btn-outline" onClick={handleClose}>
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-4xl min-h-170 max-h-[95vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <span className="icon-[mdi--robot-happy-outline] w-6 h-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-bold">AI タスク自動生成</h2>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary btn-circle"
            onClick={handleClose}
            aria-label="閉じる"
            disabled={isGenerating || isCreating}
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
          {/* 生成中オーバーレイ */}
          <AiProgressOverlay
            isVisible={isGenerating}
            message="AIがタスク候補を生成中...（1分程度かかる場合があります）"
            onCancel={cancelGenerating}
          />
          {step === 'input' ? (
            /* 入力フォーム */
            <div className="space-y-6">
              {/* 既存タスクがある場合の警告 */}
              {predecessorTaskOptions.length > 0 && (
                <div className="alert alert-soft alert-warning">
                  <span className="icon-[mdi--alert-outline] w-5 h-5 shrink-0" aria-hidden="true" />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">既存タスク: {predecessorTaskOptions.length}件</span>
                    <span className="text-sm">
                      AIは既存タスクを考慮せず新規タスクを提案します。重複を避けるため、追加情報欄に以下を記載することを推奨します：
                    </span>
                    <ul className="text-sm list-disc list-inside ml-2 text-base-content/80">
                      <li>生成したいフェーズ（例: テストフェーズのみ）</li>
                      <li>追加された要件の内容</li>
                      <li>除外したい作業範囲</li>
                    </ul>
                    <span className="text-sm text-base-content/70 mt-1">
                      ※ 提案タスクの番号（T-1等）は一時的なもので、保存時に既存タスクの続きから採番されます
                    </span>
                  </div>
                </div>
              )}

              {/* プロジェクト期間 */}
              <div className="card bg-base-200/50 p-4">
                <h3 className="font-semibold mb-4">プロジェクト期間</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <span className="label">
                      <span className="label-text font-semibold">
                        開始日 <span className="text-error">*</span>
                      </span>
                    </span>
                    <DatePicker value={startDate} onChange={setStartDate} disabled={isGenerating} className="w-full" />
                  </div>
                  <div className="form-control">
                    <span className="label">
                      <span className="label-text font-semibold">完了日</span>
                    </span>
                    <DatePicker value={endDate} onChange={setEndDate} disabled={isGenerating} className="w-full" />
                  </div>
                </div>
              </div>

              {/* 追加情報 */}
              <div className="form-control">
                <label htmlFor="additionalContext" className="label">
                  <span className="label-text font-semibold">追加情報（任意）</span>
                </label>
                <textarea
                  id="additionalContext"
                  className="textarea textarea-bordered w-full h-24"
                  placeholder="プロジェクトの特別な要件、制約、優先事項などがあれば入力してください"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  disabled={isGenerating}
                  maxLength={2000}
                />
              </div>

              {/* エラー表示 */}
              {generationError && (
                <div className="alert alert-soft alert-error">
                  <span>{generationError}</span>
                </div>
              )}
            </div>
          ) : (
            /* 生成結果表示 */
            <div className="space-y-4">
              {/* AI提案サマリー */}
              {generationResponse && (
                <div className="card bg-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <span className="icon-[mdi--lightbulb-outline] w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold">
                        推定期間: {generationResponse.totalEstimatedDays}日 / {candidates.length}件のタスク候補
                      </p>
                      {generationResponse.criticalPathDescription && (
                        <p className="text-sm text-base-content/70">{generationResponse.criticalPathDescription}</p>
                      )}
                      {generationResponse.suggestions && generationResponse.suggestions.length > 0 && (
                        <ul className="text-sm text-base-content/70 list-disc list-inside">
                          {generationResponse.suggestions.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 全選択/全解除 */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-secondary"
                    checked={candidates.length > 0 && candidates.every((c) => c.isSelected)}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-sm">すべて選択</span>
                </label>
                <span className="text-sm text-base-content/70">{selectedCount}件選択中</span>
              </div>

              {/* タスク候補リスト */}
              <div className="space-y-2">
                {candidates.map((candidate, index) => (
                  <div
                    key={candidate.tempId}
                    className={`card border ${candidate.isSelected ? 'border-primary bg-base-100' : 'border-base-300 bg-base-200/50 opacity-60'}`}
                  >
                    {/* ヘッダー行 */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => setExpandedTempId(expandedTempId === candidate.tempId ? null : candidate.tempId)}
                    >
                      {/* 選択チェックボックス */}
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={candidate.isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleCandidateSelection(candidate.tempId);
                        }}
                      />

                      {/* タスク番号 */}
                      <span className="text-xs font-mono text-base-content/50 min-w-10">T-{index + 1}</span>

                      {/* タスク内容 */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{candidate.content}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-base-content/70">
                          {candidate.estimatedSize && (
                            <span
                              className={`badge badge-xs ${sizeLabels[candidate.estimatedSize].className}`}
                              title={sizeLabels[candidate.estimatedSize].description}
                            >
                              {sizeLabels[candidate.estimatedSize].label}
                            </span>
                          )}
                          {candidate.isOnCriticalPath && (
                            <span
                              className="badge badge-xs badge-error"
                              title={`クリティカルパス上のタスク${
                                successorMap.get(candidate.tempId)?.length
                                  ? `（後続: ${successorMap
                                      .get(candidate.tempId)
                                      ?.map((id) => `T-${tempIdToIndex.get(id)}`)
                                      .join(', ')}）`
                                  : ''
                              }`}
                            >
                              🔴 CP
                            </span>
                          )}
                          {candidate.canParallelize && (
                            <span className="badge badge-xs badge-info" title="並行作業可能">
                              ═══
                            </span>
                          )}
                          {/* 後続タスク表示 */}
                          {successorMap.get(candidate.tempId) && successorMap.get(candidate.tempId)!.length > 0 && (
                            <span
                              className="text-base-content/50"
                              title={`このタスクが完了しないと開始できないタスク: ${successorMap
                                .get(candidate.tempId)
                                ?.map((id) => `T-${tempIdToIndex.get(id)}`)
                                .join(', ')}`}
                            >
                              →{' '}
                              {successorMap
                                .get(candidate.tempId)
                                ?.map((id) => `T-${tempIdToIndex.get(id)}`)
                                .join(', ')}
                            </span>
                          )}
                          {/* 先行タスク表示 */}
                          {candidate.predecessorTempIds && candidate.predecessorTempIds.length > 0 && (
                            <span
                              className="text-base-content/50"
                              title={`先行タスク: ${candidate.predecessorTempIds
                                .map((id) => `T-${tempIdToIndex.get(id)}`)
                                .join(', ')}`}
                            >
                              ← {candidate.predecessorTempIds.map((id) => `T-${tempIdToIndex.get(id)}`).join(', ')}
                            </span>
                          )}
                          {candidate.assignee && (
                            <span className="flex items-center gap-1">
                              <UserAvatar
                                userName={candidate.assignee.username}
                                isActive={true}
                                identityIconUrl={candidate.assignee.identityIconUrl}
                                size={16}
                                showName={false}
                              />
                              <span>{candidate.assignee.username}</span>
                              {/* 負荷バッジ */}
                              {workloadMap[String(candidate.assignee.id)] && (
                                <WorkloadIndicator
                                  workload={workloadMap[String(candidate.assignee.id)]}
                                  compact
                                  size="sm"
                                />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 展開アイコン */}
                      <span
                        className={`icon-[mdi--chevron-down] w-5 h-5 transition-transform ${expandedTempId === candidate.tempId ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </div>

                    {/* 展開時の詳細編集エリア */}
                    {expandedTempId === candidate.tempId && (
                      <div className="border-t border-base-300 p-4 space-y-4">
                        {/* AI理由 */}
                        {candidate.rationale && (
                          <div className="text-sm text-base-content/70 bg-base-200 rounded p-2">
                            <span className="font-semibold">AI補足:</span> {candidate.rationale}
                          </div>
                        )}
                        {candidate.taskTypeRationale && (
                          <div className="text-sm text-base-content/70 bg-base-200 rounded p-2">
                            <span className="font-semibold">タスクタイプ選択理由:</span> {candidate.taskTypeRationale}
                          </div>
                        )}
                        {candidate.assigneeRationale && (
                          <div className="text-sm text-base-content/70 bg-base-200 rounded p-2">
                            <span className="font-semibold">担当者選択理由:</span> {candidate.assigneeRationale}
                          </div>
                        )}

                        {/* 編集フォーム */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* タスクタイプ */}
                          <div className="form-control">
                            <span className="label">
                              <span className="label-text font-semibold">
                                タスクタイプ <span className="text-error">*</span>
                              </span>
                            </span>
                            <TaskTypeSelect
                              taskTypes={taskTypes}
                              value={candidate.taskTypeId}
                              onChange={(value) => updateCandidate(candidate.tempId, { taskTypeId: value })}
                              disabled={!candidate.isSelected}
                            />
                          </div>

                          {/* 担当者 */}
                          <div className="form-control relative">
                            <span className="label">
                              <span className="label-text font-semibold">
                                担当者 <span className="text-error">*</span>
                              </span>
                            </span>
                            {candidate.assignee ? (
                              <div className="flex items-center gap-2 h-12 px-3 border border-base-300 rounded-btn bg-base-100">
                                <UserAvatar
                                  userName={candidate.assignee.username}
                                  isActive={true}
                                  identityIconUrl={candidate.assignee.identityIconUrl}
                                  size={24}
                                  showName={false}
                                />
                                <span className="flex-1 truncate">{candidate.assignee.username}</span>
                                {workloadMap[candidate.assignee.id] && (
                                  <WorkloadIndicator workload={workloadMap[candidate.assignee.id]} compact size="sm" />
                                )}
                                <button
                                  type="button"
                                  className="btn btn-xs btn-secondary btn-circle"
                                  onClick={() => updateCandidate(candidate.tempId, { assignee: null })}
                                  disabled={!candidate.isSelected}
                                >
                                  <span className="icon-[mdi--close] w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="relative">
                                <DebouncedSearchInput
                                  placeholder="ユーザー名で検索..."
                                  onSearch={(q) => handleAssigneeSearch(q, candidate.tempId)}
                                  debounceMs={300}
                                  disabled={!candidate.isSelected}
                                />
                                {/* 検索結果ドロップダウン */}
                                {showAssigneeDropdown && editingAssigneeTempId === candidate.tempId && (
                                  <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-btn shadow-lg max-h-48 overflow-y-auto">
                                    {isSearchingAssignee ? (
                                      <div className="p-3 text-center">
                                        <span className="loading loading-spinner loading-sm" />
                                      </div>
                                    ) : assigneeSearchResults.length > 0 ? (
                                      assigneeSearchResults.map((user) => (
                                        <button
                                          key={user.id}
                                          type="button"
                                          className="w-full flex items-center gap-2 p-2 hover:bg-base-200 text-left"
                                          onClick={() => handleSelectAssignee(user, candidate.tempId)}
                                        >
                                          <UserAvatar
                                            userName={user.username || ''}
                                            isActive={true}
                                            identityIconUrl={user.identityIconUrl}
                                            size={24}
                                            showName={false}
                                          />
                                          <div className="flex-1">
                                            <div className="font-medium">{user.username}</div>
                                            <div className="text-xs text-base-content/70">{user.email}</div>
                                          </div>
                                          {user.id && workloadMap[user.id] && (
                                            <WorkloadIndicator workload={workloadMap[user.id]} compact size="sm" />
                                          )}
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-3 text-center text-base-content/70">該当なし</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* 自分を設定リンク */}
                            {!candidate.assignee && currentUser && (
                              <button
                                type="button"
                                className="text-xs text-primary hover:underline mt-1 text-left"
                                onClick={() =>
                                  updateCandidate(candidate.tempId, {
                                    assignee: {
                                      id: currentUser.id,
                                      username: currentUser.username,
                                      email: currentUser.email,
                                      identityIconUrl: currentUser.identityIconUrl,
                                    },
                                  })
                                }
                                disabled={!candidate.isSelected}
                              >
                                自分を設定
                              </button>
                            )}
                          </div>

                          {/* 開始日 */}
                          <div className="form-control">
                            <span className="label">
                              <span className="label-text font-semibold">開始日</span>
                            </span>
                            <DatePicker
                              value={candidate.startDate || ''}
                              onChange={(value) => updateCandidate(candidate.tempId, { startDate: value || null })}
                              disabled={!candidate.isSelected}
                              className="w-full"
                            />
                          </div>

                          {/* 期限日 */}
                          <div className="form-control">
                            <span className="label">
                              <span className="label-text font-semibold">
                                期限日 <span className="text-error">*</span>
                              </span>
                            </span>
                            <DatePicker
                              value={candidate.dueDate}
                              onChange={(value) => updateCandidate(candidate.tempId, { dueDate: value })}
                              disabled={!candidate.isSelected}
                              className="w-full"
                            />
                          </div>

                          {/* 工数 */}
                          <div className="form-control">
                            <label htmlFor={`estimatedHours-${candidate.tempId}`} className="label">
                              <span className="label-text font-semibold">工数（時間）</span>
                            </label>
                            <input
                              id={`estimatedHours-${candidate.tempId}`}
                              type="number"
                              className="input input-bordered w-full"
                              placeholder="例: 8"
                              min={0}
                              step={0.5}
                              value={candidate.estimatedHours ?? ''}
                              onChange={(e) =>
                                updateCandidate(candidate.tempId, {
                                  estimatedHours: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              disabled={!candidate.isSelected}
                            />
                            {candidate.estimatedSize && (
                              <span className="text-xs text-base-content/60 mt-1">
                                参考: {sizeLabels[candidate.estimatedSize].description}
                              </span>
                            )}
                          </div>

                          {/* 先行タスク（複数選択対応） */}
                          <div className="form-control">
                            <span className="label">
                              <span className="label-text font-semibold">先行タスク（複数選択可）</span>
                              <span className="label-text-alt text-base-content/60">完了しないと着手できない</span>
                            </span>
                            <div className="border border-base-300 rounded-lg p-2 max-h-48 overflow-y-auto bg-base-100">
                              {predecessorTaskOptions.length === 0 &&
                              candidates.filter(
                                (c) =>
                                  c.tempId !== candidate.tempId &&
                                  candidates.indexOf(c) < candidates.indexOf(candidate),
                              ).length === 0 ? (
                                <p className="text-base-content/60 text-sm py-2 text-center">
                                  選択可能なタスクがありません
                                </p>
                              ) : (
                                <div className="space-y-1">
                                  {/* 既存タスク */}
                                  {predecessorTaskOptions.length > 0 && (
                                    <>
                                      <div className="text-xs font-semibold text-base-content/70 px-2 pt-1">
                                        既存タスク
                                      </div>
                                      {predecessorTaskOptions.map((t) => (
                                        <label
                                          key={`existing:${t.id}`}
                                          className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-base-200 transition-colors ${
                                            candidate.predecessorTaskIds.includes(t.id) ? 'bg-primary/10' : ''
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm checkbox-primary mt-0.5"
                                            checked={candidate.predecessorTaskIds.includes(t.id)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                updateCandidate(candidate.tempId, {
                                                  predecessorTaskIds: [...candidate.predecessorTaskIds, t.id],
                                                });
                                              } else {
                                                updateCandidate(candidate.tempId, {
                                                  predecessorTaskIds: candidate.predecessorTaskIds.filter(
                                                    (id) => id !== t.id,
                                                  ),
                                                });
                                              }
                                            }}
                                            disabled={!candidate.isSelected}
                                          />
                                          <span
                                            className={`text-sm flex-1 ${t.isCompleted ? 'line-through text-base-content/50' : ''}`}
                                          >
                                            T-{t.sequence}:{' '}
                                            {t.content.length > 40 ? `${t.content.substring(0, 40)}...` : t.content}
                                            {t.isCompleted && (
                                              <span className="ml-1 badge badge-sm badge-success">完了</span>
                                            )}
                                          </span>
                                        </label>
                                      ))}
                                    </>
                                  )}
                                  {/* 同一バッチ内のタスク（自分より前のもの） */}
                                  {candidates.filter(
                                    (c) =>
                                      c.tempId !== candidate.tempId &&
                                      candidates.indexOf(c) < candidates.indexOf(candidate),
                                  ).length > 0 && (
                                    <>
                                      <div className="text-xs font-semibold text-base-content/70 px-2 pt-2">
                                        今回作成するタスク
                                      </div>
                                      {candidates
                                        .filter(
                                          (c) =>
                                            c.tempId !== candidate.tempId &&
                                            candidates.indexOf(c) < candidates.indexOf(candidate),
                                        )
                                        .map((c, idx) => (
                                          <label
                                            key={`batch:${c.tempId}`}
                                            className={`flex items-start gap-2 p-2 rounded cursor-pointer hover:bg-base-200 transition-colors ${
                                              candidate.predecessorTempIds.includes(c.tempId) ? 'bg-primary/10' : ''
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              className="checkbox checkbox-sm checkbox-primary mt-0.5"
                                              checked={candidate.predecessorTempIds.includes(c.tempId)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  updateCandidate(candidate.tempId, {
                                                    predecessorTempIds: [...candidate.predecessorTempIds, c.tempId],
                                                  });
                                                } else {
                                                  updateCandidate(candidate.tempId, {
                                                    predecessorTempIds: candidate.predecessorTempIds.filter(
                                                      (id) => id !== c.tempId,
                                                    ),
                                                  });
                                                }
                                              }}
                                              disabled={!candidate.isSelected}
                                            />
                                            <span className="text-sm flex-1">
                                              #{idx + 1}:{' '}
                                              {c.content.length > 40 ? `${c.content.substring(0, 40)}...` : c.content}
                                            </span>
                                          </label>
                                        ))}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            {(candidate.predecessorTaskIds.length > 0 || candidate.predecessorTempIds.length > 0) && (
                              <div className="label">
                                <span className="label-text-alt text-base-content/60">
                                  {candidate.predecessorTaskIds.length + candidate.predecessorTempIds.length}件選択中
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-secondary ml-2"
                                    onClick={() =>
                                      updateCandidate(candidate.tempId, {
                                        predecessorTaskIds: [],
                                        predecessorTempIds: [],
                                      })
                                    }
                                    disabled={!candidate.isSelected}
                                  >
                                    クリア
                                  </button>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* フィードバック（再生成用） */}
              <div className="form-control">
                <label htmlFor="feedbackResult" className="label">
                  <span className="label-text font-semibold">フィードバック（修正依頼）</span>
                </label>
                <textarea
                  id="feedbackResult"
                  className="textarea textarea-bordered w-full h-20"
                  placeholder="「テストタスクも追加してください」「設計フェーズをもっと細分化してください」など"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={isGenerating || isCreating}
                  maxLength={2000}
                />
              </div>

              {/* エラー表示 */}
              {createError && (
                <div className="alert alert-soft alert-error">
                  <span>{createError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end p-4 sm:p-6 border-t border-base-300 shrink-0">
          {step === 'input' ? (
            <>
              <button
                type="button"
                className="btn btn-outline w-full sm:w-auto order-2 sm:order-1"
                onClick={handleClose}
                disabled={isGenerating}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-primary w-full sm:w-auto order-1 sm:order-2"
                onClick={handleGenerate}
                disabled={isGenerating || !startDate}
              >
                {isGenerating ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    生成中...
                  </>
                ) : (
                  <>
                    <span className="icon-[mdi--robot-happy-outline] w-5 h-5" aria-hidden="true" />
                    タスクを生成
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline w-full sm:w-auto order-3 sm:order-1"
                onClick={() => setStep('input')}
                disabled={isGenerating || isCreating}
              >
                戻る
              </button>
              <button
                type="button"
                className="btn btn-secondary w-full sm:w-auto order-2 sm:order-2"
                onClick={handleGenerate}
                disabled={isGenerating || isCreating}
              >
                {isGenerating ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    再生成中...
                  </>
                ) : (
                  <>
                    <span className="icon-[mdi--refresh] w-5 h-5" aria-hidden="true" />
                    再生成
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-primary w-full sm:w-auto order-1 sm:order-3"
                onClick={handleBulkCreate}
                disabled={isGenerating || isCreating || selectedCount === 0 || !canEdit}
              >
                {isCreating ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    作成中...
                  </>
                ) : (
                  <>
                    <span className="icon-[mdi--check-all] w-5 h-5" aria-hidden="true" />
                    {selectedCount}件のタスクを作成
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
