'use client';

import { useEffect, useState } from 'react';

interface DeleteConfirmModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じる際のコールバック */
  onClose: () => void;
  /** 削除を確定した際のコールバック（非同期） */
  onConfirm: () => Promise<void>;
  /** 削除対象の種類（例: "スキル", "タグ", "ユーザー"） */
  itemType: string;
  /** 削除対象の名前 */
  itemName: string;
  /** 追加の警告メッセージ（オプション） */
  additionalWarning?: string;
}

/**
 * 汎用的な削除確認モーダルコンポーネント
 *
 * 削除ボタンを押す前に確認ダイアログを表示し、ユーザーの意図を確認します。
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
  additionalWarning,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isDeleting) {
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

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
              <span className="icon-[mdi--alert-outline] w-6 h-6 text-error" aria-hidden="true" />
            </div>
            <div>
              <h2 id="delete-modal-title" className="text-xl font-bold text-error">
                {itemType}の削除
              </h2>
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
          {/* 削除対象情報 */}
          <div className="bg-base-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-base-content/70">{itemType}名</span>
              <span className="font-semibold">{itemName}</span>
            </div>
          </div>

          {/* 確認メッセージ */}
          <p className="text-base-content mb-4">この{itemType}を削除してもよろしいですか？</p>

          {/* 追加の警告メッセージ */}
          {additionalWarning && (
            <div className="alert alert-soft alert-warning mb-4">
              <span className="icon-[mdi--alert-outline] w-5 h-5" aria-hidden="true" />
              <span className="text-sm">{additionalWarning}</span>
            </div>
          )}

          {/* ボタングループ */}
          <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isDeleting}>
              キャンセル
            </button>
            <button type="button" className="btn btn-error" onClick={handleConfirm} disabled={isDeleting}>
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
