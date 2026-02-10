'use client';

import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  isSubmitting: boolean;
  onConfirm: (name: string, expirationDays?: number) => void;
  onClose: () => void;
}

export default function CreateApiKeyModal({ isOpen, isSubmitting, onConfirm, onClose }: Props) {
  const [name, setName] = useState('');
  const [expirationDays, setExpirationDays] = useState<number>(365);

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // モーダルを開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      setName('');
      setExpirationDays(365);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name.trim(), expirationDays);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-base-100 rounded-box flex w-full max-w-md flex-col shadow-xl">
        {/* ヘッダー */}
        <div className="border-base-300 flex shrink-0 items-center justify-between border-b p-4 sm:p-6">
          <h2 className="text-xl font-bold">APIキーの発行</h2>
          <button
            type="button"
            className="btn btn-sm btn-circle"
            aria-label="閉じる"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="create-api-key-form" noValidate onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="form-control">
                <label htmlFor="api-key-name" className="label">
                  <span className="label-text font-semibold">
                    キー名 <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  id="api-key-name"
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="例: Partner System A"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-control">
                <label htmlFor="api-key-expiration" className="label">
                  <span className="label-text font-semibold">
                    有効期限（日数） <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  id="api-key-expiration"
                  type="number"
                  className="input input-bordered w-full"
                  min={1}
                  max={730}
                  required
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                  disabled={isSubmitting}
                />
                <p className="label label-text-alt text-base-content/60">1〜730日の範囲で指定</p>
              </div>

              {/* ボタングループ */}
              <div className="border-base-300 flex justify-end gap-2 border-t pt-4">
                <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !name.trim()}>
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      発行中...
                    </>
                  ) : (
                    <>
                      <span className="icon-[mdi--key-plus] size-5" aria-hidden="true" />
                      発行する
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
