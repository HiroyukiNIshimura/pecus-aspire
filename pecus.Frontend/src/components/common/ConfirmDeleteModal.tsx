"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface ConfirmDeleteModalProps {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  requireCodeConfirmation?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface ConfirmDeleteModalRef {
  open: () => void;
  close: () => void;
}

const ConfirmDeleteModal = forwardRef<ConfirmDeleteModalRef, ConfirmDeleteModalProps>(
  (
    {
      title = "削除の確認",
      message = "このアイテムを削除してもよろしいですか？",
      confirmText = "削除",
      cancelText = "キャンセル",
      requireCodeConfirmation = true,
      onConfirm,
      onCancel,
    },
    ref,
  ) => {
    const [modalId] = useState(() => `modal-${Math.random().toString(36).substr(2, 9)}`);
    const [_isOpen, setIsOpen] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [mismatch, setMismatch] = useState<boolean>(false);
    const overlayRef = useRef<HTMLDivElement>(null);
    const hsOverlayRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        setIsOpen(true);

        if (hsOverlayRef.current) {
          try {
            hsOverlayRef.current.open();
          } catch (error) {
            console.error("Error opening modal:", error);
            // Fallback: 手動でクラスを変更
            const element = document.getElementById(modalId);
            if (element) {
              element.classList.remove("hidden");
            }
          }
        } else {
          // Fallback: 手動でクラスを変更
          const element = document.getElementById(modalId);
          if (element) {
            element.classList.remove("hidden");
          }
        }

        // requireCodeConfirmation が true の場合のみ8桁ランダムコードを生成して表示、入力欄をリセット
        if (requireCodeConfirmation) {
          const code = generateRandomCode();
          setGeneratedCode(code);
        } else {
          setGeneratedCode("");
        }
        setInputValue("");
        setMismatch(false);
      },
      close: () => {
        setIsOpen(false);

        if (hsOverlayRef.current) {
          try {
            hsOverlayRef.current.close();
          } catch (error) {
            console.error("Error closing modal:", error);
            // Fallback: 手動でクラスを変更
            const element = document.getElementById(modalId);
            if (element) {
              element.classList.add("hidden");
            }
          }
        } else {
          // Fallback: 手動でクラスを変更
          const element = document.getElementById(modalId);
          if (element) {
            element.classList.add("hidden");
          }
        }
        onCancel?.();
      },
    }));

    useEffect(() => {
      // HSOverlay.autoInit() が呼ばれた後、インスタンスを取得する
      const getOverlayInstance = () => {
        if (typeof window !== "undefined" && window.HSOverlay) {
          // overlayRef.current を優先的に使用（React管理の要素）
          const element = overlayRef.current || document.getElementById(modalId);

          if (element) {
            try {
              // 新しいHSOverlayインスタンスを作成
              hsOverlayRef.current = new window.HSOverlay(element);
            } catch (error) {
              console.error("Error creating HSOverlay instance:", error);
            }
          } else {
            setTimeout(getOverlayInstance, 100);
          }
        } else if (typeof window !== "undefined" && !window.HSOverlay) {
          // HSOverlayがまだ読み込まれていない場合は再試行
          setTimeout(getOverlayInstance, 100);
        }
      };

      // FlyonUI スクリプトの読み込み完了を待ってからインスタンスを取得
      const timer = setTimeout(getOverlayInstance, 300);

      return () => {
        clearTimeout(timer);
        if (hsOverlayRef.current) {
          hsOverlayRef.current = null;
        }
      };
    }, [modalId]);

    // 8桁コード生成器
    function generateRandomCode(): string {
      // 8桁の数字のみ
      return Math.floor(10000000 + Math.random() * 90000000).toString();
    }

    const handleConfirm = () => {
      // requireCodeConfirmation が true の場合のみ入力値と生成コードを比較
      if (requireCodeConfirmation) {
        if (inputValue !== generatedCode) {
          setMismatch(true);
          return;
        }
      }
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
        {/* FlyonUI モーダル */}
        <div
          ref={overlayRef}
          id={modalId}
          className="overlay modal overlay-open:opacity-100 hidden"
          role="dialog"
          tabIndex={-1}
          aria-labelledby={`${modalId}-title`}
        >
          <div className="modal-dialog overlay-open:opacity-100">
            <div className="modal-content">
              {/* ヘッダー */}
              <div className="modal-header">
                <h3 id={`${modalId}-title`} className="modal-title">
                  {title}
                </h3>
                <button
                  type="button"
                  className="btn btn-text btn-circle btn-sm absolute end-3 top-3"
                  aria-label="Close"
                  onClick={handleCancel}
                >
                  <span className="icon-[tabler--x] size-4"></span>
                </button>
              </div>

              {/* ボディ */}
              <div className="modal-body">
                <p className="text-sm text-base-content/70">{message}</p>
                {/* requireCodeConfirmation が true の場合のみランダムコードの表示と入力欄を表示 */}
                {requireCodeConfirmation && generatedCode && (
                  <>
                    {/* ランダムコードの表示 */}
                    <div className="mt-2 text-sm text-base-content/70">
                      削除コード: <span className="font-mono ml-1">{generatedCode}</span>
                    </div>
                    {/* 入力欄 */}
                    <div className="mt-2">
                      <label htmlFor={`${modalId}-code-input`} className="label">
                        削除コードを入力してください
                      </label>
                      <input
                        id={`${modalId}-code-input`}
                        type="text"
                        className="input input-bordered w-full"
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          if (mismatch) setMismatch(false);
                        }}
                        maxLength={8}
                        placeholder="8桁のコードを入力"
                        inputMode="numeric"
                      />
                    </div>
                    {mismatch && (
                      <div className="text-xs text-error mt-1">
                        コードが一致しません。正しいコードを入力してください。
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* フッター */}
              <div className="modal-footer">
                <button type="button" className="btn btn-soft btn-secondary" onClick={handleCancel}>
                  {cancelText}
                </button>
                <button type="button" className="btn btn-primary" onClick={handleConfirm}>
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
);

ConfirmDeleteModal.displayName = "ConfirmDeleteModal";

export default ConfirmDeleteModal;

// グローバル関数として公開（外部からモーダルを開くため）
declare global {
  interface Window {
    HSOverlay: typeof import("flyonui/flyonui").HSOverlay;
  }
}
