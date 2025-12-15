'use client';

import { useEffect, useState } from 'react';
import type { WorkspaceRole } from '@/connectors/api/pecus';

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
      onClose();
    }
  };

  if (!isOpen) return null;

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
          <button type="button" className="btn btn-sm btn-circle" onClick={handleClose} aria-label="閉じる">
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
