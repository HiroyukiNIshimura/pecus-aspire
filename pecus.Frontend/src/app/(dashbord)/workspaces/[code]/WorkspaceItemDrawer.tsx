'use client';

import { useState } from 'react';
import { updateWorkspaceItem, updateWorkspaceItemAssignee } from '@/actions/workspaceItem';
import type {
  ErrorResponse,
  TaskPriority,
  WorkspaceDetailUserResponse,
  WorkspaceItemDetailResponse,
} from '@/connectors/api/pecus';
import { getDisplayIconUrl } from '@/utils/imageUrl';

/** 優先度のラベル定義 */
const PRIORITY_OPTIONS: { value: TaskPriority | null; label: string; className: string }[] = [
  { value: null, label: '未設定', className: '' },
  { value: 'Low', label: '低', className: 'text-info' },
  { value: 'Medium', label: '中', className: 'text-warning' },
  { value: 'High', label: '高', className: 'text-error' },
  { value: 'Critical', label: '緊急', className: 'text-error font-bold' },
];

interface WorkspaceItemDrawerProps {
  item: WorkspaceItemDetailResponse;
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  members?: WorkspaceDetailUserResponse[];
  onItemUpdate?: (updatedItem: WorkspaceItemDetailResponse) => void;
}

export default function WorkspaceItemDrawer({
  item,
  isOpen,
  isClosing,
  onClose,
  members = [],
  onItemUpdate,
}: WorkspaceItemDrawerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(item.assigneeId || null);
  const [selectedCommitterId, setSelectedCommitterId] = useState<number | null>(item.committerId || null);
  const [isArchived, setIsArchived] = useState<boolean>(item.isArchived ?? false);
  const [dueDate, setDueDate] = useState<string>(item.dueDate ? item.dueDate.split('T')[0] : '');
  const [priority, setPriority] = useState<TaskPriority | null>(item.priority ?? null);
  const [currentRowVersion, setCurrentRowVersion] = useState<number>(item.rowVersion);

  if (!isOpen) return null;

  /** 汎用アイテム更新ハンドラー */
  const handleItemUpdate = async (
    updateFn: () => Promise<{
      success: boolean;
      data?: WorkspaceItemDetailResponse;
      message?: string;
    }>,
    errorMessage: string,
    rollbackFn?: () => void,
  ) => {
    try {
      setIsUpdating(true);
      setError(null);

      const result = await updateFn();

      if (result.success && result.data) {
        setCurrentRowVersion(result.data.rowVersion);
        onItemUpdate?.(result.data);
      } else {
        setError(result.message || errorMessage);
        rollbackFn?.();
      }
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'error' in err && err.error === 'conflict') {
        // TODO: ConcurrencyErrorの場合の処理
        setError('別のユーザーが同時に編集しました。ページをリロードしてください。');
      } else {
        setError((err as ErrorResponse).message || errorMessage);
      }
      rollbackFn?.();
    } finally {
      setIsUpdating(false);
    }
  };

  /** 担当者変更ハンドラー */
  const handleAssigneeChange = async (newAssigneeId: number | null) => {
    const prevValue = selectedAssigneeId;
    setSelectedAssigneeId(newAssigneeId);

    await handleItemUpdate(
      async () => {
        const result = await updateWorkspaceItemAssignee(item.workspaceId ?? 0, item.id, {
          assigneeId: newAssigneeId,
          rowVersion: currentRowVersion,
        });
        return result;
      },
      '担当者の更新に失敗しました。',
      () => setSelectedAssigneeId(prevValue),
    );
  };

  /** コミッター変更ハンドラー */
  const handleCommitterChange = async (newCommitterId: number | null) => {
    const prevValue = selectedCommitterId;
    setSelectedCommitterId(newCommitterId);

    await handleItemUpdate(
      async () => {
        const result = await updateWorkspaceItem(item.workspaceId ?? 0, item.id, {
          committerId: newCommitterId,
          rowVersion: currentRowVersion,
        });
        if (result.success && result.data.workspaceItem) {
          return { success: true, data: result.data.workspaceItem };
        }
        return { success: false, message: result.success ? 'アイテム情報の取得に失敗しました。' : result.message };
      },
      'コミッターの更新に失敗しました。',
      () => setSelectedCommitterId(prevValue),
    );
  };

  /** アーカイブ切り替えハンドラー */
  const handleArchivedChange = async (newIsArchived: boolean) => {
    const prevValue = isArchived;
    setIsArchived(newIsArchived);

    await handleItemUpdate(
      async () => {
        const result = await updateWorkspaceItem(item.workspaceId ?? 0, item.id, {
          isArchived: newIsArchived,
          rowVersion: currentRowVersion,
        });
        if (result.success && result.data.workspaceItem) {
          return { success: true, data: result.data.workspaceItem };
        }
        return { success: false, message: result.success ? 'アイテム情報の取得に失敗しました。' : result.message };
      },
      'アーカイブ状態の更新に失敗しました。',
      () => setIsArchived(prevValue),
    );
  };

  /** 期限変更ハンドラー */
  const handleDueDateChange = async (newDueDate: string) => {
    const prevValue = dueDate;
    setDueDate(newDueDate);

    await handleItemUpdate(
      async () => {
        const result = await updateWorkspaceItem(item.workspaceId ?? 0, item.id, {
          dueDate: newDueDate || null,
          rowVersion: currentRowVersion,
        });
        if (result.success && result.data.workspaceItem) {
          return { success: true, data: result.data.workspaceItem };
        }
        return { success: false, message: result.success ? 'アイテム情報の取得に失敗しました。' : result.message };
      },
      '期限の更新に失敗しました。',
      () => setDueDate(prevValue),
    );
  };

  /** 優先度変更ハンドラー */
  const handlePriorityChange = async (newPriority: TaskPriority | null) => {
    const prevValue = priority;
    setPriority(newPriority);

    await handleItemUpdate(
      async () => {
        const result = await updateWorkspaceItem(item.workspaceId ?? 0, item.id, {
          priority: newPriority ?? undefined,
          rowVersion: currentRowVersion,
        });
        if (result.success && result.data.workspaceItem) {
          return { success: true, data: result.data.workspaceItem };
        }
        return { success: false, message: result.success ? 'アイテム情報の取得に失敗しました。' : result.message };
      },
      '優先度の更新に失敗しました。',
      () => setPriority(prevValue),
    );
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
          <button type="button" className="btn btn-default btn-circle btn-sm" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 p-4 space-y-4">
          {/* エラーメッセージ */}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* 担当者設定 */}
          <div className="form-control">
            <div className="label">
              <span className="label-text font-semibold">担当者</span>
            </div>
            <select
              value={selectedAssigneeId || ''}
              onChange={(e) => handleAssigneeChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
              disabled={isUpdating}
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
            {selectedAssigneeId &&
              (() => {
                const assignee = getSelectedMember(selectedAssigneeId);
                return assignee ? (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-base-200 rounded">
                    {assignee.identityIconUrl ? (
                      <img
                        src={getDisplayIconUrl(assignee.identityIconUrl)}
                        alt={assignee.userName || 'ユーザー'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs">
                        ？
                      </div>
                    )}
                    <span className="text-sm font-semibold">{assignee.userName}</span>
                  </div>
                ) : null;
              })()}
          </div>

          {/* コミッター設定 */}
          <div className="form-control">
            <div className="label">
              <span className="label-text font-semibold">コミッター</span>
            </div>
            <select
              value={selectedCommitterId || ''}
              onChange={(e) => handleCommitterChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)}
              disabled={isUpdating}
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
            {selectedCommitterId &&
              (() => {
                const committer = getSelectedMember(selectedCommitterId);
                return committer ? (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-base-200 rounded">
                    {committer.identityIconUrl ? (
                      <img
                        src={getDisplayIconUrl(committer.identityIconUrl)}
                        alt={committer.userName || 'ユーザー'}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs">
                        ？
                      </div>
                    )}
                    <span className="text-sm font-semibold">{committer.userName}</span>
                  </div>
                ) : null;
              })()}
          </div>

          <div className="divider my-2" />

          {/* アーカイブ設定 */}
          <div className="form-control">
            <label htmlFor="archive-switch" className="label cursor-pointer justify-start gap-3">
              <input
                id="archive-switch"
                type="checkbox"
                className="switch switch-primary"
                checked={isArchived}
                onChange={(e) => handleArchivedChange(e.target.checked)}
                disabled={isUpdating}
              />
              <span className="label-text font-semibold">アーカイブ</span>
            </label>
            <p className="text-xs text-base-content/60 ml-12">アーカイブされたアイテムは編集不可になります</p>
          </div>

          <div className="divider my-2" />

          {/* 期限設定 */}
          <div className="form-control">
            <div className="label">
              <span className="label-text font-semibold">期限</span>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              disabled={isUpdating}
              className="input input-bordered"
            />
            {dueDate && (
              <button
                type="button"
                className="btn btn-ghost btn-xs mt-1"
                onClick={() => handleDueDateChange('')}
                disabled={isUpdating}
              >
                期限をクリア
              </button>
            )}
          </div>

          {/* 優先度設定 */}
          <div className="form-control">
            <div className="label">
              <span className="label-text font-semibold">優先度</span>
            </div>
            <select
              value={priority || ''}
              onChange={(e) => handlePriorityChange((e.target.value as TaskPriority) || null)}
              disabled={isUpdating}
              className="select select-bordered"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value || 'none'} value={option.value || ''} className={option.className}>
                  {option.label}
                </option>
              ))}
            </select>
            {priority && (
              <div className="mt-2">
                <span
                  className={`badge ${
                    priority === 'Low'
                      ? 'badge-info'
                      : priority === 'Medium'
                        ? 'badge-warning'
                        : priority === 'High'
                          ? 'badge-error'
                          : 'badge-error'
                  }`}
                >
                  {PRIORITY_OPTIONS.find((o) => o.value === priority)?.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex gap-2 p-4 border-t border-base-300 bg-base-100" />
      </div>
    </>
  );
}
