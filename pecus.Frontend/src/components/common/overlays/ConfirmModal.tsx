'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type ConfirmVariant = 'primary' | 'warning' | 'error';

interface ConfirmModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じる際のコールバック */
  onClose: () => void;
  /** 確定した際のコールバック（非同期可） */
  onConfirm: () => void | Promise<void>;
  /** モーダルのタイトル */
  title: string;
  /** 確認内容の説明 */
  description: ReactNode;
  /** 確定ボタンのラベル */
  confirmLabel?: string;
  /** キャンセルボタンのラベル */
  cancelLabel?: string;
  /** 確定ボタンのスタイル */
  variant?: ConfirmVariant;
  /** ヘッダーのアイコン（Tailwind のアイコンユーティリティクラス） */
  iconClass?: string;
}

const VARIANT_STYLES: Record<ConfirmVariant, { icon: string; button: string; title: string }> = {
  primary: { icon: 'bg-primary/10 text-primary', button: 'btn-primary', title: 'text-base-content' },
  warning: { icon: 'bg-warning/10 text-warning', button: 'btn-warning', title: 'text-base-content' },
  error: { icon: 'bg-error/10 text-error', button: 'btn-error', title: 'text-error' },
};

/**
 * 汎用的な確認モーダルコンポーネント
 *
 * ブラウザ標準の `confirm()` の代わりに利用する。
 * 削除など破壊的な操作の確認に使用し、通常操作の確認には使わない。
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  variant = 'primary',
  iconClass = 'icon-[tabler--alert-triangle]',
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleClose = () => {
    if (!isConfirming) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isConfirming) {
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
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

  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
    >
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${styles.icon}`}>
              <span className={`${iconClass} w-6 h-6`} aria-hidden="true" />
            </div>
            <h2 id="confirm-modal-title" className={`text-lg font-bold ${styles.title}`}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary btn-circle"
            onClick={handleClose}
            disabled={isConfirming}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* モーダルボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div id="confirm-modal-description" className="text-base-content whitespace-pre-line">
            {description}
          </div>

          <div className="flex gap-2 justify-end pt-4 mt-4 border-t border-base-300">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isConfirming}>
              {cancelLabel}
            </button>
            <button type="button" className={`btn ${styles.button}`} onClick={handleConfirm} disabled={isConfirming}>
              {isConfirming ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  処理中...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
