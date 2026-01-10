'use client';

import { useEffect, useState } from 'react';
import type { WorkspaceMemberAssignmentsResponse, WorkspaceRole } from '@/connectors/api/pecus';

interface ChangeRoleModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** 変更対象のユーザー名 */
  userName: string;
  /** 現在のロール */
  currentRole: WorkspaceRole;
  /** 新しいロール */
  newRole: WorkspaceRole;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** 変更確定時のコールバック */
  onConfirm: () => Promise<void>;
  /** アサインメントエラー情報（Viewer変更時にタスク/アイテムがある場合） */
  assignmentsError?: WorkspaceMemberAssignmentsResponse | null;
  /** アサインメントエラーをクリアするコールバック */
  onClearAssignmentsError?: () => void;
}

/** ロール表示名 */
const roleDisplayNames: Record<WorkspaceRole, string> = {
  Owner: 'オーナー',
  Member: 'メンバー',
  Viewer: '閲覧者',
};

/**
 * ロール変更確認モーダル
 */
export default function ChangeRoleModal({
  isOpen,
  userName,
  currentRole,
  newRole,
  onClose,
  onConfirm,
  assignmentsError,
  onClearAssignmentsError,
}: ChangeRoleModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      await onConfirm();
    } finally {
      setIsUpdating(false);
    }
  };

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isUpdating) {
      onClearAssignmentsError?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  // アサインメントエラーがある場合はエラー表示モード
  if (assignmentsError) {
    const { assignedTasks, assignedItems } = assignmentsError;
    const hasAssignedTasks = assignedTasks && assignedTasks.length > 0;
    const hasAssignedItems = assignedItems && assignedItems.length > 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
        <div
          className="bg-base-100 rounded-box shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold text-error">ロール変更不可</h2>
            <button
              type="button"
              className="btn btn-sm btn-secondary btn-circle"
              onClick={handleClose}
              aria-label="閉じる"
            >
              <span className="icon-[mdi--close] size-5" aria-hidden="true" />
            </button>
          </div>

          {/* ボディ */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <p className="mb-4">
              <span className="font-semibold">{userName}</span> さんには担当中のタスク/アイテムがあるため、
              閲覧者に変更できません。
            </p>
            <p className="text-sm text-base-content/70 mb-4">
              以下のタスク/アイテムの担当者を変更してからやり直してください。
            </p>

            {/* 担当中のタスク一覧 */}
            {hasAssignedTasks && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <span className="icon-[mdi--checkbox-marked-outline] size-4" aria-hidden="true" />
                  担当中のタスク（{assignedTasks.length}件）
                </h3>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {assignedTasks.map((task) => (
                    <li key={task.taskId} className="bg-base-200 rounded p-2 text-sm">
                      <button
                        type="button"
                        className="link link-primary flex items-center gap-1 text-left"
                        onClick={() => {
                          handleClose();
                          // 同一ワークスペースページ内でのクエリパラメータ変更は
                          // router.push では反映されないため、ブラウザナビゲーションを使用
                          window.location.href = `/workspaces/${task.workspaceCode}?itemCode=${task.itemNumber}&task=${task.taskSequence}`;
                        }}
                      >
                        <span className="icon-[mdi--open-in-new] size-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          T-{task.taskSequence}
                          &nbsp;{task.taskContent || '（タスク内容なし）'}
                        </span>
                      </button>
                      <div className="text-xs text-base-content/60 mt-1">
                        アイテム: #{task.itemNumber} - {task.itemSubject}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 担当中のアイテム一覧 */}
            {hasAssignedItems && (
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <span className="icon-[mdi--file-document-outline] size-4" aria-hidden="true" />
                  担当中のアイテム（{assignedItems.length}件）
                </h3>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {assignedItems.map((item) => (
                    <li key={item.itemId} className="bg-base-200 rounded p-2 text-sm">
                      <button
                        type="button"
                        className="link link-primary flex items-center gap-1 text-left"
                        onClick={() => {
                          handleClose();
                          // 同一ワークスペースページ内でのクエリパラメータ変更は
                          // router.push では反映されないため、ブラウザナビゲーションを使用
                          window.location.href = `/workspaces/${item.workspaceCode}?itemCode=${item.itemNumber}`;
                        }}
                      >
                        <span className="icon-[mdi--open-in-new] size-3 shrink-0" aria-hidden="true" />
                        <span className="font-mono text-xs">{item.itemNumber}</span>
                        <span className="truncate">{item.itemSubject || '（件名なし）'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ボタン */}
            <div className="flex justify-end pt-4 border-t border-base-300 mt-4">
              <button type="button" className="btn btn-outline" onClick={handleClose}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold">ロールを変更しますか？</h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary btn-circle"
            onClick={handleClose}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="mb-4">
            <span className="font-semibold">{userName}</span> のロールを変更します。
          </p>
          <div className="flex items-center gap-2 text-base-content/80">
            <span className="badge badge-outline">{roleDisplayNames[currentRole]}</span>
            <span>→</span>
            <span className="badge badge-primary">{roleDisplayNames[newRole]}</span>
          </div>
          {newRole === 'Owner' && (
            <p className="text-sm text-warning mt-4">
              ⚠️ オーナー権限を付与すると、このユーザーはワークスペースの設定を変更できるようになります。
            </p>
          )}
          {newRole === 'Viewer' && (
            <p className="text-sm text-base-content/70 mt-4">
              閲覧者は、ワークスペースのコンテンツを閲覧のみ可能です。
            </p>
          )}

          {/* ボタン */}
          <div className="flex gap-2 justify-end pt-4 border-t border-base-300 mt-6">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isUpdating}>
              キャンセル
            </button>
            <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  変更中...
                </>
              ) : (
                '変更する'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
