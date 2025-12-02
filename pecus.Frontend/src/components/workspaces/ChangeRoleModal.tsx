'use client';

import { useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* モーダルコンテンツ */}
      <div className="relative bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="font-bold text-lg">ロールを変更しますか？</h3>
        <p className="py-4">
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
          <p className="text-sm text-base-content/70 mt-4">閲覧者は、ワークスペースのコンテンツを閲覧のみ可能です。</p>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="btn btn-default" onClick={onClose} disabled={isUpdating}>
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
  );
}
