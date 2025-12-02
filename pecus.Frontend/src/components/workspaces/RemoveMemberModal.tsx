'use client';

import { useEffect, useState } from 'react';

interface RemoveMemberModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** 削除対象のユーザー名（表示用） */
  userName: string;
  /** 削除対象のメールアドレス（確認入力用） */
  email: string;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** 削除確定時のコールバック */
  onConfirm: () => Promise<void>;
}

/**
 * メンバー削除確認モーダル
 * - Emailを入力しないと削除ボタンを押せない
 */
export default function RemoveMemberModal({ isOpen, userName, email, onClose, onConfirm }: RemoveMemberModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // モーダルが閉じられたら入力をクリア
  useEffect(() => {
    if (!isOpen) {
      setConfirmInput('');
    }
  }, [isOpen]);

  const isConfirmValid = confirmInput === email;

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!isConfirmValid || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      {/* モーダルコンテンツ */}
      <div
        className="relative bg-base-100 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg text-error">メンバーを削除しますか？</h3>

        {/* ユーザー情報 */}
        <div className="bg-base-200 rounded-lg p-4 my-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-base-content/70 shrink-0">ユーザー名</span>
            <span className="font-semibold truncate">{userName}</span>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-sm text-base-content/70">メールアドレス</span>
            <code className="badge badge-soft badge-accent text-xs break-all whitespace-normal h-auto py-1">
              {email}
            </code>
          </div>
        </div>

        <p className="text-sm text-base-content/70">
          ⚠️ この操作を行うと、このユーザーはワークスペースにアクセスできなくなります。
        </p>

        {/* 確認入力 */}
        <div className="form-control mt-4">
          <label htmlFor="confirmEmail" className="label">
            <span className="label-text font-semibold">削除を確認するため、メールアドレスを入力してください</span>
          </label>
          <input
            id="confirmEmail"
            type="email"
            placeholder={email}
            className={`input input-bordered ${confirmInput && !isConfirmValid ? 'input-error' : ''}`}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={isDeleting}
            autoComplete="off"
          />
          {confirmInput && !isConfirmValid && (
            <div className="label">
              <span className="label-text-alt text-error">メールアドレスが一致しません</span>
            </div>
          )}
        </div>

        {/* ボタン */}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isDeleting}>
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
              '削除する'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
