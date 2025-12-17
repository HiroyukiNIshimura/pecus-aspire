'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: User | null;
}

export default function DeleteUserModal({ isOpen, onClose, onConfirm, user }: DeleteUserModalProps) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // モーダルが閉じられたら入力をクリア
  useEffect(() => {
    if (!isOpen) {
      setConfirmEmail('');
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (confirmEmail !== user?.email || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose(); // 削除成功時にモーダルを閉じる
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmValid = confirmEmail === user?.email;

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
              <span className="icon-[mdi--alert-outline] w-6 h-6 text-error" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-error">ユーザーの削除</h2>
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

        {/* モーダルボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* 警告メッセージ */}
          <div className="alert alert-soft alert-error mb-4">
            <span className="icon-[mdi--alert-outline] w-5 h-5" aria-hidden="true" />
            <div>
              <p className="font-semibold">重要な警告</p>
              <p className="text-sm">このユーザーに関連するすべてのデータが完全に削除されます。</p>
            </div>
          </div>

          {/* ユーザー情報 */}
          <div className="bg-base-200 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">ユーザー名</span>
                <span className="font-semibold">{user.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">メールアドレス</span>
                <code className="badge badge-soft badge-accent text-xs">{user.email}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">ステータス</span>
                <span className={`badge ${user.isActive ? 'badge-success' : 'badge-neutral'}`}>
                  {user.isActive ? 'アクティブ' : '非アクティブ'}
                </span>
              </div>
            </div>
          </div>

          {/* 確認入力 */}
          <div className="form-control mb-6">
            <label htmlFor="confirmEmail" className="label">
              <span className="label-text font-semibold">
                削除を確認するため、メールアドレス
                <code className="mx-1 badge badge-soft badge-accent badge-sm">{user.email}</code>
                を入力してください
              </span>
            </label>
            <input
              id="confirmEmail"
              type="email"
              placeholder={`${user.email} を入力`}
              className={`input input-bordered ${confirmEmail && !isConfirmValid ? 'input-error' : ''}`}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              disabled={isDeleting}
              autoComplete="off"
            />
            {confirmEmail && !isConfirmValid && (
              <div className="label">
                <span className="label-text-alt text-error">メールアドレスが一致しません</span>
              </div>
            )}
          </div>

          {/* ボタングループ */}
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
