'use client';

import { useEffect, useState } from 'react';
import { fetchChildrenCount } from '@/actions/workspaceItem';
import DatePicker from '@/components/common/filters/DatePicker';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import ArchiveConfirmModal from '@/components/workspaceItems/ArchiveConfirmModal';
import type {
  TaskPriority,
  WorkspaceDetailUserResponse,
  WorkspaceItemDetailResponse,
  WorkspaceMode,
} from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';

/** 優先度のラベル定義 */
const PRIORITY_OPTIONS: { value: TaskPriority | null; label: string; className: string }[] = [
  { value: null, label: '未設定', className: '' },
  { value: 'Low', label: '低', className: 'text-info' },
  { value: 'Medium', label: '中', className: 'text-warning' },
  { value: 'High', label: '高', className: 'text-error' },
  { value: 'Critical', label: '緊急', className: 'text-error font-bold' },
];

/** 更新リクエストの型定義 */
export interface ItemAttributeUpdateRequest {
  type: 'assignee' | 'committer' | 'archive' | 'dueDate' | 'priority';
  value: number | string | boolean | null;
  /** アーカイブ時のみ: 子アイテムの親子関係を維持するか */
  keepChildrenRelation?: boolean;
}

interface WorkspaceItemDrawerProps {
  item: WorkspaceItemDetailResponse;
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  members?: WorkspaceDetailUserResponse[];
  currentUserId?: number;
  /** ワークスペースモード（ドキュメントモードの場合アーカイブ時に確認モーダルを表示） */
  workspaceMode?: WorkspaceMode | null;
  /** ワークスペース編集権限があるかどうか（Viewer以外）*/
  canEdit?: boolean;
  /** 更新処理中かどうか（親から渡される） */
  isUpdating?: boolean;
  /** エラーメッセージ（親から渡される） */
  error?: string | null;
  /** 属性更新リクエスト（親に委譲） */
  onAttributeUpdate: (request: ItemAttributeUpdateRequest) => Promise<void>;
}

export default function WorkspaceItemDrawer({
  item,
  isOpen,
  isClosing,
  onClose,
  members = [],
  currentUserId,
  workspaceMode,
  canEdit: canEditWorkspace = true,
  isUpdating = false,
  error = null,
  onAttributeUpdate,
}: WorkspaceItemDrawerProps) {
  // UI表示用のローカル状態（楽観的更新用）
  const [localAssigneeId, setLocalAssigneeId] = useState<number | null>(item.assigneeId || null);
  const [localCommitterId, setLocalCommitterId] = useState<number | null>(item.committerId || null);
  const [localIsArchived, setLocalIsArchived] = useState<boolean>(item.isArchived ?? false);
  const [localDueDate, setLocalDueDate] = useState<string>(item.dueDate ? item.dueDate.split('T')[0] : '');
  const [localPriority, setLocalPriority] = useState<TaskPriority | null>(item.priority ?? null);

  // アーカイブ確認モーダルの状態（ドキュメントモード用）
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);
  const [totalDescendantsCount, setTotalDescendantsCount] = useState(0);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  const notify = useNotify();

  // item propが更新されたらローカル状態を同期
  useEffect(() => {
    setLocalAssigneeId(item.assigneeId || null);
    setLocalCommitterId(item.committerId || null);
    setLocalIsArchived(item.isArchived ?? false);
    setLocalDueDate(item.dueDate ? item.dueDate.split('T')[0] : '');
    setLocalPriority(item.priority ?? null);
  }, [item.id, item.assigneeId, item.committerId, item.isArchived, item.dueDate, item.priority]);

  // 権限フラグの計算
  const isOwner = currentUserId !== undefined && item.ownerId === currentUserId;
  const isAssignee = currentUserId !== undefined && item.assigneeId === currentUserId;
  const isDraft = item.isDraft ?? false;

  // オーナーまたは担当者かどうか（編集権限あり）
  const canEdit = isOwner || isAssignee;
  // 下書き中はオーナーのみ編集可能
  const canEditDraft = isOwner;

  if (!isOpen) return null;

  /** 担当者変更ハンドラー */
  const handleAssigneeChange = async (newAssigneeId: number | null) => {
    if (isUpdating) return;
    if (!canEditWorkspace) {
      notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
      return;
    }

    const prevValue = localAssigneeId;
    setLocalAssigneeId(newAssigneeId);

    try {
      await onAttributeUpdate({ type: 'assignee', value: newAssigneeId });
    } catch {
      setLocalAssigneeId(prevValue);
    }
  };

  /** コミッター変更ハンドラー */
  const handleCommitterChange = async (newCommitterId: number | null) => {
    if (isUpdating) return;
    if (!canEditWorkspace) {
      notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
      return;
    }

    const prevValue = localCommitterId;
    setLocalCommitterId(newCommitterId);

    try {
      await onAttributeUpdate({ type: 'committer', value: newCommitterId });
    } catch {
      setLocalCommitterId(prevValue);
    }
  };

  /** アーカイブ切り替えハンドラー */
  const handleArchivedChange = async (newIsArchived: boolean) => {
    if (isUpdating) return;
    if (!canEditWorkspace) {
      notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
      return;
    }

    // アーカイブOFFにする場合は直接実行
    if (!newIsArchived) {
      await executeArchive(false, undefined);
      return;
    }

    // ドキュメントモードでアーカイブONにする場合は子アイテム数をチェック
    if (workspaceMode === 'Document') {
      setIsLoadingChildren(true);
      try {
        const result = await fetchChildrenCount(item.workspaceId ?? 0, item.id);
        if (result.success && result.data) {
          const { childrenCount: count, totalDescendantsCount: total } = result.data;
          if (count > 0) {
            // 子アイテムがある場合は確認モーダルを表示
            setChildrenCount(count);
            setTotalDescendantsCount(total);
            setIsArchiveModalOpen(true);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch children count:', err);
      } finally {
        setIsLoadingChildren(false);
      }
    }

    // 子アイテムがない場合または通常モードの場合は直接実行
    await executeArchive(true, undefined);
  };

  /** アーカイブ実行 */
  const executeArchive = async (newIsArchived: boolean, keepChildrenRelation: boolean | undefined) => {
    const prevValue = localIsArchived;
    setLocalIsArchived(newIsArchived);

    try {
      await onAttributeUpdate({
        type: 'archive',
        value: newIsArchived,
        keepChildrenRelation,
      });
    } catch {
      setLocalIsArchived(prevValue);
    }
  };

  /** アーカイブ確認モーダルからの確定 */
  const handleArchiveConfirm = async (keepChildrenRelation: boolean) => {
    setIsArchiveModalOpen(false);
    await executeArchive(true, keepChildrenRelation);
  };

  /** 期限変更ハンドラー（ローカル状態のみ更新） */
  const handleDueDateLocalChange = (newDueDate: string) => {
    setLocalDueDate(newDueDate);
  };

  /** 期限確定ハンドラー（カレンダー閉じた時に呼ばれる） */
  const handleDueDateCommit = async (newDueDate: string) => {
    // 値が変わっていない場合は何もしない
    const originalDate = item.dueDate ? item.dueDate.split('T')[0] : '';
    if (newDueDate === originalDate) return;

    if (isUpdating) return;
    if (!canEditWorkspace) {
      notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
      return;
    }

    const prevValue = localDueDate;
    setLocalDueDate(newDueDate);

    try {
      // 日付を ISO 8601 形式（UTC）に変換
      let isoDateValue: string | null = null;
      if (newDueDate) {
        const date = new Date(newDueDate);
        isoDateValue = date.toISOString();
      }
      await onAttributeUpdate({ type: 'dueDate', value: isoDateValue });
    } catch {
      setLocalDueDate(prevValue);
    }
  };

  /** 優先度変更ハンドラー */
  const handlePriorityChange = async (newPriority: TaskPriority | null) => {
    if (isUpdating) return;
    if (!canEditWorkspace) {
      notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
      return;
    }

    const prevValue = localPriority;
    setLocalPriority(newPriority);

    try {
      await onAttributeUpdate({ type: 'priority', value: newPriority });
    } catch {
      setLocalPriority(prevValue);
    }
  };

  /** 選択されたメンバーの情報を取得 */
  const getSelectedMember = (userId: number | null) => {
    if (!userId) return null;
    return members.find((m) => m.id === userId);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
      `}</style>

      {/* 背景オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
        style={{
          animation: isClosing ? 'fadeOut 0.25s ease-out' : 'fadeIn 0.2s ease-out',
        }}
      />

      {/* ドローワー本体 */}
      <div
        id="workspace-item-drawer"
        className="fixed top-0 right-0 h-full w-80 bg-base-100 shadow-xl z-50 overflow-y-auto flex flex-col transition-transform duration-300 ease-out"
        role="dialog"
        tabIndex={-1}
        style={{
          animation: isClosing ? 'slideOutRight 0.25s ease-in' : 'slideInRight 0.3s ease-out',
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
          <h3 className="text-lg font-bold">アイテム属性</h3>
          <button type="button" className="btn btn-secondary btn-circle btn-sm" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 p-4 space-y-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="alert alert-soft alert-warning">
              <span>{error}</span>
            </div>
          )}

          {/* 担当者設定 */}
          <div className="form-control">
            <div className="label">
              <span className="label-text font-semibold" title="このアイテムの担当または作業者を設定します">
                担当者
              </span>
            </div>
            <select
              value={localAssigneeId || ''}
              onChange={(e) => handleAssigneeChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
              disabled={isUpdating || localIsArchived}
              className="select select-bordered"
            >
              <option value="">未割当</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.userName}
                </option>
              ))}
            </select>

            {/* 現在の担当者情報を表示 */}
            {localAssigneeId &&
              (() => {
                const assignee = getSelectedMember(localAssigneeId);
                return assignee ? (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-base-200 rounded">
                    <UserAvatar
                      userName={assignee.userName}
                      identityIconUrl={assignee.identityIconUrl}
                      size={24}
                      nameClassName="text-sm font-semibold"
                    />
                  </div>
                ) : null;
              })()}
          </div>

          {/* コミッター設定（オーナーまたは担当者のみ表示、下書き中はオーナーのみ） */}
          {((isDraft && canEditDraft) || (!isDraft && canEdit)) && (
            <div className="form-control">
              <div className="label">
                <span className="label-text font-semibold" title="このアイテムのタスクを管理する担当者を設定します">
                  コミッター
                </span>
              </div>
              <select
                value={localCommitterId || ''}
                onChange={(e) => handleCommitterChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
                disabled={isUpdating || localIsArchived}
                className="select select-bordered"
              >
                <option value="">未割当</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.userName}
                  </option>
                ))}
              </select>

              {/* 現在のコミッター情報を表示 */}
              {localCommitterId &&
                (() => {
                  const committer = getSelectedMember(localCommitterId);
                  return committer ? (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-base-200 rounded">
                      <UserAvatar
                        userName={committer.userName}
                        identityIconUrl={committer.identityIconUrl}
                        size={24}
                        nameClassName="text-sm font-semibold"
                      />
                    </div>
                  ) : null;
                })()}
            </div>
          )}

          <div className="divider my-2" />

          {/* 期限設定（誰でも表示） */}
          <div className="form-control">
            <div className="label">
              <span className="label-text font-semibold">期限</span>
            </div>
            <DatePicker
              value={localDueDate}
              onChange={handleDueDateLocalChange}
              onClose={handleDueDateCommit}
              disabled={isUpdating || localIsArchived}
            />
            {localDueDate && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn btn-xs mt-1"
                  onClick={() => handleDueDateCommit('')}
                  disabled={isUpdating || localIsArchived}
                >
                  期限をクリア
                </button>
              </div>
            )}
          </div>

          {/* 優先度設定（誰でも表示） */}
          <div className="form-control">
            <div className="label">
              <span className="label-text font-semibold">優先度</span>
            </div>
            <select
              value={localPriority || ''}
              onChange={(e) => handlePriorityChange((e.target.value as TaskPriority) || null)}
              disabled={isUpdating || localIsArchived}
              className="select select-bordered"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value || 'none'} value={option.value || ''} className={option.className}>
                  {option.label}
                </option>
              ))}
            </select>
            {localPriority && (
              <div className="mt-2">
                <span
                  className={`badge ${
                    localPriority === 'Low'
                      ? 'badge-info'
                      : localPriority === 'Medium'
                        ? 'badge-warning'
                        : localPriority === 'High'
                          ? 'badge-error'
                          : 'badge-error'
                  }`}
                >
                  {PRIORITY_OPTIONS.find((o) => o.value === localPriority)?.label}
                </span>
              </div>
            )}
          </div>

          {/* アーカイブ設定（オーナーまたは担当者のみ表示、下書き中はオーナーのみ） */}
          {((isDraft && canEditDraft) || (!isDraft && canEdit)) && (
            <>
              <div className="divider my-2" />

              <div className="form-control">
                <div className="flex items-center gap-3">
                  <input
                    id="archive-switch"
                    type="checkbox"
                    className="switch switch-primary"
                    checked={localIsArchived}
                    onChange={(e) => handleArchivedChange(e.target.checked)}
                    disabled={isUpdating || isLoadingChildren}
                  />
                  <label htmlFor="archive-switch" className="label-text font-semibold cursor-pointer">
                    アーカイブ
                  </label>
                  {isLoadingChildren && <span className="loading loading-spinner loading-xs" />}
                </div>
                <p className="text-xs text-base-content/60 mt-1">アーカイブされたアイテムは編集不可になります</p>
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-4 border-t border-base-300 bg-base-100" />
      </div>

      {/* アーカイブ確認モーダル（ドキュメントモード用） */}
      <ArchiveConfirmModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveConfirm}
        childrenCount={childrenCount}
        totalDescendantsCount={totalDescendantsCount}
        isSubmitting={isUpdating}
      />
    </>
  );
}
