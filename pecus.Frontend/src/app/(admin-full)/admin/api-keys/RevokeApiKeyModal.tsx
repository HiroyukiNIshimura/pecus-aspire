'use client';

import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  keyName: string;
  keyPrefix: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function RevokeApiKeyModal({ isOpen, keyName, keyPrefix, isSubmitting, onConfirm, onClose }: Props) {
  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="bg-base-100 rounded-box flex w-full max-w-md flex-col shadow-xl">
        {/* ヘッダー */}
        <div className="border-base-300 flex shrink-0 items-center justify-between border-b p-4 sm:p-6">
          <h2 className="text-xl font-bold">APIキーの失効</h2>
          <button
            type="button"
            className="btn btn-sm btn-circle"
            aria-label="閉じる"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* 警告 */}
            <div className="alert alert-soft alert-error">
              <span className="icon-[mdi--alert-circle-outline] size-6 shrink-0" aria-hidden="true" />
              <span>この操作は取り消せません。失効したキーは再度有効にできません。</span>
            </div>

            {/* キー情報 */}
            <div className="bg-base-200 rounded-lg p-4">
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-base-content/70">名前</dt>
                  <dd className="font-medium">{keyName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-base-content/70">プレフィックス</dt>
                  <dd>
                    <code>{keyPrefix}...</code>
                  </dd>
                </div>
              </dl>
            </div>

            {/* ボタングループ */}
            <div className="border-base-300 flex justify-end gap-2 border-t pt-4">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                キャンセル
              </button>
              <button type="button" className="btn btn-error" onClick={onConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    処理中…
                  </>
                ) : (
                  '失効する'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
