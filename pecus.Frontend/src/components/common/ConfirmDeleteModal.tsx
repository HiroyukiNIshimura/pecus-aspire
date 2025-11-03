"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface ConfirmDeleteModalProps {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface ConfirmDeleteModalRef {
  open: () => void;
  close: () => void;
}

const ConfirmDeleteModal = forwardRef<ConfirmDeleteModalRef, ConfirmDeleteModalProps>(({
  title = "削除の確認",
  message = "このアイテムを削除してもよろしいですか？",
  confirmText = "削除",
  cancelText = "キャンセル",
  onConfirm,
  onCancel
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hsOverlayRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
      // FlyonUIのプログラム的制御
      if (hsOverlayRef.current) {
        hsOverlayRef.current.open();
      }
    },
    close: () => {
      setIsOpen(false);
      if (hsOverlayRef.current) {
        hsOverlayRef.current.close();
      }
      onCancel?.();
    }
  }));

  useEffect(() => {
    // FlyonUIの初期化（クライアントサイドのみ）
    if (typeof window !== 'undefined' && window.HSOverlay && overlayRef.current) {
      hsOverlayRef.current = new window.HSOverlay(overlayRef.current);
      return () => {
        if (hsOverlayRef.current) {
          hsOverlayRef.current.destroy();
        }
      };
    }
  }, []);

  const handleConfirm = () => {
    onConfirm();
    if (hsOverlayRef.current) {
      hsOverlayRef.current.close();
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (hsOverlayRef.current) {
      hsOverlayRef.current.close();
    }
    setIsOpen(false);
    onCancel?.();
  };

  return (
    <>
      {/* モーダルオーバーレイ */}
      <div
        ref={overlayRef}
        className={`overlay ${isOpen ? '' : 'hidden'}`}
      >
        <div
          ref={modalRef}
          className="modal modal-middle"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              {/* ヘッダー */}
              <div className="modal-header">
                <h3 className="modal-title">{title}</h3>
                <button
                  type="button"
                  className="btn btn-text btn-circle btn-sm"
                  onClick={handleCancel}
                  aria-label="閉じる"
                >
                  <span className="icon icon-close"></span>
                </button>
              </div>

              {/* ボディ */}
              <div className="modal-body">
                <p className="text-sm text-base-content/70">{message}</p>
              </div>

              {/* フッター */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCancel}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className="btn btn-error"
                  onClick={handleConfirm}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

ConfirmDeleteModal.displayName = 'ConfirmDeleteModal';

export default ConfirmDeleteModal;

// グローバル関数として公開（外部からモーダルを開くため）
declare global {
  interface Window {
    HSOverlay: any;
  }
}