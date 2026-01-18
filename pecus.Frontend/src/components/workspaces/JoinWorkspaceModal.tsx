'use client';

import { useEffect, useState } from 'react';

interface JoinWorkspaceModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** ワークスペース名 */
  workspaceName: string;
  /** ワークスペースコード */
  workspaceCode: string;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** 参加確定時のコールバック */
  onConfirm: () => Promise<void>;
}

/**
 * ワークスペース参加確認モーダル
 * - 閲覧者として参加することを確認
 */
export default function JoinWorkspaceModal({
  isOpen,
  workspaceName,
  workspaceCode,
  onClose,
  onConfirm,
}: JoinWorkspaceModalProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが閉じられたらエラーをクリア
  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isJoining) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isJoining) {
      return;
    }

    setIsJoining(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : '参加に失敗しました');
    } finally {
      setIsJoining(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      {/* モーダルコンテナ */}
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold">ワークスペースに参加</h2>
          <button
            type="button"
            className="btn btn-sm btn-secondary btn-circle"
            onClick={handleClose}
            disabled={isJoining}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* ワークスペース情報 */}
          <div className="bg-base-200 rounded-lg p-4 mb-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-base-content/70 shrink-0">ワークスペース名</span>
                <span className="font-semibold truncate">{workspaceName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-base-content/70 shrink-0">コード</span>
                <code className="badge badge-soft badge-accent text-xs">{workspaceCode}</code>
              </div>
            </div>
          </div>

          <div className="alert alert-info mb-4">
            <span className="icon-[mdi--information-outline] size-5 shrink-0" aria-hidden="true" />
            <span className="text-sm">
              <strong>閲覧者</strong>として参加します。タスクやアイテムの作成・編集はできませんが、内容を閲覧できます。
            </span>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="alert alert-soft alert-error mb-4">
              <span className="icon-[mdi--alert-circle-outline] size-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isJoining}>
              キャンセル
            </button>
            <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={isJoining}>
              {isJoining ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  参加中...
                </>
              ) : (
                <>
                  <span className="icon-[mdi--account-plus-outline] size-5" aria-hidden="true" />
                  参加する
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
