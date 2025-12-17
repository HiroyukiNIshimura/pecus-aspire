'use client';

import { useEffect } from 'react';

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (keepChildrenRelation: boolean) => void;
  childrenCount: number;
  totalDescendantsCount: number;
  isSubmitting: boolean;
}

/**
 * アーカイブ確認モーダル（ドキュメントモード用）
 * 子アイテムがある場合に、親子関係の処理方法を選択させる
 */
export default function ArchiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  childrenCount,
  totalDescendantsCount,
  isSubmitting,
}: ArchiveConfirmModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-md flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="icon-[mdi--archive-outline] size-5 text-warning" aria-hidden="true" />
            アーカイブの確認
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="閉じる"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="p-4 space-y-4">
          <p className="text-base-content">
            このアイテムには
            <span className="font-bold text-primary mx-1">{childrenCount}件</span>
            の子アイテムがあります。
            {totalDescendantsCount > childrenCount && (
              <span className="text-base-content/70 text-sm block mt-1">
                （孫以下を含めると計{totalDescendantsCount}件）
              </span>
            )}
          </p>

          <div className="space-y-3">
            <button
              type="button"
              className="btn btn-outline w-full justify-start text-left h-auto py-3"
              onClick={() => onConfirm(false)}
              disabled={isSubmitting}
            >
              <span className="icon-[mdi--file-move-outline] size-5 shrink-0" aria-hidden="true" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">子アイテムをルートに移動</span>
                <span className="text-xs text-base-content/70 font-normal">親子関係を解除してからアーカイブします</span>
              </div>
            </button>

            <button
              type="button"
              className="btn btn-warning w-full justify-start text-left h-auto py-3"
              onClick={() => onConfirm(true)}
              disabled={isSubmitting}
            >
              <span className="icon-[mdi--archive-outline] size-5 shrink-0" aria-hidden="true" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">親子関係を維持してアーカイブ</span>
                <span className="text-xs text-warning-content/70 font-normal">
                  アーカイブ解除時に子アイテムも復活します
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-end p-4 border-t border-base-300">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
