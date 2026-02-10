'use client';

import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  rawKey: string;
  keyName: string;
  onClose: () => void;
}

export default function RawKeyModal({ isOpen, rawKey, keyName, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 開くたびにコピー状態をリセット
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="bg-base-100 rounded-box flex w-full max-w-lg flex-col shadow-xl">
        {/* ヘッダー */}
        <div className="border-base-300 flex shrink-0 items-center justify-between border-b p-4 sm:p-6">
          <h2 className="text-xl font-bold">APIキーが発行されました</h2>
          <button type="button" className="btn btn-sm btn-circle" aria-label="閉じる" onClick={onClose}>
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* 警告 */}
            <div className="alert alert-soft alert-warning">
              <span className="icon-[mdi--alert-outline] size-6 shrink-0" aria-hidden="true" />
              <span>このキーは今回のみ表示されます。必ずコピーして安全な場所に保管してください。</span>
            </div>

            {/* キー表示 */}
            <div>
              <p className="text-sm font-medium">{keyName}</p>
              <div className="bg-base-200 mt-2 flex items-center gap-2 rounded-lg p-3">
                <code className="flex-1 break-all text-sm">{rawKey}</code>
                <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <span className="icon-[mdi--check] size-4" aria-hidden="true" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <span className="icon-[mdi--content-copy] size-4" aria-hidden="true" />
                      コピー
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ボタングループ */}
            <div className="border-base-300 flex justify-end border-t pt-4">
              <button type="button" className="btn btn-primary" onClick={onClose}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
