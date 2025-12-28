'use client';

import { useEffect, useState } from 'react';

interface Organization {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

interface DeleteOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  organization: Organization | null;
}

export default function DeleteOrganizationModal({
  isOpen,
  onClose,
  onConfirm,
  organization,
}: DeleteOrganizationModalProps) {
  const [confirmCode, setConfirmCode] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmCode('');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (confirmCode !== organization?.code || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmValid = confirmCode === organization?.code;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !organization) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
              <span className="icon-[mdi--alert-outline] w-6 h-6 text-error" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-error">組織の削除</h2>
              <p className="text-sm text-base-content/70">この操作は取り消せません</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle"
            onClick={handleClose}
            disabled={isDeleting}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="alert alert-soft alert-error mb-4">
            <span className="icon-[mdi--alert-outline] w-5 h-5" aria-hidden="true" />
            <div>
              <p className="font-semibold">重要な警告</p>
              <p className="text-sm">
                この組織に関連するすべてのデータ（ユーザー、ワークスペース、タスクなど）が完全に削除されます。
              </p>
            </div>
          </div>

          <div className="bg-base-200 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">組織名</span>
                <span className="font-semibold">{organization.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">組織コード</span>
                <code className="badge badge-soft badge-accent text-xs">{organization.code}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">ステータス</span>
                <span className={`badge ${organization.isActive ? 'badge-success' : 'badge-neutral'}`}>
                  {organization.isActive ? '有効' : '無効'}
                </span>
              </div>
            </div>
          </div>

          <div className="form-control mb-6">
            <label htmlFor="confirmCode" className="label">
              <span className="label-text font-semibold">
                削除を確認するため、組織コード
                <code className="mx-1 badge badge-soft badge-accent badge-sm">{organization.code}</code>
                を入力してください
              </span>
            </label>
            <input
              id="confirmCode"
              type="text"
              placeholder={`${organization.code} を入力`}
              className={`input input-bordered ${confirmCode && !isConfirmValid ? 'input-error' : ''}`}
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              disabled={isDeleting}
              autoComplete="off"
            />
            {confirmCode && !isConfirmValid && (
              <div className="label">
                <span className="label-text-alt text-error">組織コードが一致しません</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isDeleting}>
              キャンセル
            </button>
            <button
              type="button"
              className="btn btn-error"
              onClick={handleConfirm}
              disabled={!isConfirmValid || isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  削除中...
                </>
              ) : (
                <>
                  <span className="icon-[mdi--delete-outline] w-4 h-4" aria-hidden="true" />
                  削除する
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
