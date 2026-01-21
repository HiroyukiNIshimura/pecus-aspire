'use client';

import { useEffect, useRef, useState } from 'react';
import { cancelAgenda } from '@/actions/agenda';
import { useNotify } from '@/hooks/useNotify';

interface CancelConfirmModalProps {
  /** モーダル表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** 中止完了後のコールバック */
  onCancelled: () => void;
  /** アジェンダID */
  agendaId: number;
  /** アジェンダタイトル */
  agendaTitle: string;
  /** 楽観的ロック用バージョン */
  rowVersion: number;
  /** 繰り返しアジェンダかどうか */
  isRecurring: boolean;
}

/**
 * シリーズ全体の中止確認モーダル
 * - 繰り返しイベントの場合は「シリーズ全体」であることを強調
 * - 中止理由の入力（任意）
 * - cancelAgenda Server Actionを呼び出す
 */
export function CancelConfirmModal({
  isOpen,
  onClose,
  onCancelled,
  agendaId,
  agendaTitle,
  rowVersion,
  isRecurring,
}: CancelConfirmModalProps) {
  const notify = useNotify();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonInputRef = useRef<HTMLTextAreaElement>(null);

  // モーダル表示時にbodyスクロールを無効化 & フォーカス
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // 少し遅延させてフォーカス
      setTimeout(() => reasonInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      // 閉じた時に状態リセット
      setReason('');
      setError(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESCキーで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = await cancelAgenda(agendaId, rowVersion, reason.trim() || undefined);

    if (result.success) {
      notify.success(isRecurring ? 'シリーズを中止しました' : '予定を中止しました');
      onCancelled();
    } else {
      setError(result.message ?? 'イベントの中止に失敗しました。');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-md flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
          <h2 className="text-lg font-bold text-error flex items-center gap-2">
            <span className="icon-[mdi--cancel] size-5" aria-hidden="true" />
            {isRecurring ? 'シリーズ全体を中止' : 'イベントを中止'}
          </h2>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ボディ */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-4 space-y-4">
            {/* 警告メッセージ */}
            <div className="alert alert-warning">
              <span className="icon-[mdi--alert] size-5" aria-hidden="true" />
              <div>
                <p className="font-medium">「{agendaTitle}」を中止しますか？</p>
                {isRecurring && (
                  <p className="text-sm mt-1">この操作はシリーズ全体に影響します。すべての回が中止されます。</p>
                )}
                <p className="text-sm mt-1">この操作は取り消せません。</p>
              </div>
            </div>

            {/* 中止理由入力 */}
            <div className="form-control">
              <label htmlFor="cancellation-reason" className="label">
                <span className="label-text font-semibold">中止理由（任意）</span>
              </label>
              <textarea
                ref={reasonInputRef}
                id="cancellation-reason"
                className="textarea textarea-bordered w-full"
                placeholder="例: 講師の都合により延期となりました。次回日程は追ってご連絡します。"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="label">
                <span className="label-text-alt text-base-content/60">参加者に通知されます（{reason.length}/500）</span>
              </div>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="alert alert-soft alert-error">
                <span className="icon-[mdi--alert-circle] size-5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="flex gap-2 justify-end p-4 border-t border-base-300">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-error" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  処理中...
                </>
              ) : (
                <>
                  <span className="icon-[mdi--cancel] size-5" aria-hidden="true" />
                  中止する
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
