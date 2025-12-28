'use client';

import { useEffect, useState } from 'react';

interface Notification {
  id: number;
  subject: string;
  isProcessed: boolean;
  messageIds?: string | null;
}

interface DeleteNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteMessages: boolean) => Promise<void>;
  notification: Notification | null;
}

export default function DeleteNotificationModal({
  isOpen,
  onClose,
  onConfirm,
  notification,
}: DeleteNotificationModalProps) {
  const [deleteMessages, setDeleteMessages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDeleteMessages(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onConfirm(deleteMessages);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !notification) {
    return null;
  }

  const hasDeliveredMessages = notification.isProcessed && notification.messageIds;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
              <span className="icon-[mdi--alert-outline] w-6 h-6 text-error" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-error">通知の削除</h2>
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="bg-base-200 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">通知ID</span>
                <span className="font-mono">{notification.id}</span>
              </div>
              <div>
                <span className="text-sm text-base-content/70">件名</span>
                <p className="font-semibold mt-1">{notification.subject}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">配信状態</span>
                <span className={`badge ${notification.isProcessed ? 'badge-success' : 'badge-warning'}`}>
                  {notification.isProcessed ? '配信済み' : '未配信'}
                </span>
              </div>
            </div>
          </div>

          {hasDeliveredMessages && (
            <div className="form-control mb-4">
              <label className="label cursor-pointer justify-start gap-3" htmlFor="delete-messages-checkbox">
                <input
                  id="delete-messages-checkbox"
                  type="checkbox"
                  className="checkbox checkbox-error"
                  checked={deleteMessages}
                  onChange={(e) => setDeleteMessages(e.target.checked)}
                  disabled={isDeleting}
                />
                <div>
                  <span className="label-text font-semibold">配信済みメッセージも削除する</span>
                  <p className="text-sm text-base-content/60 mt-1">
                    チェックすると、すでにユーザーに配信されたチャットメッセージも削除されます。
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="alert alert-soft alert-warning mb-4">
            <span className="icon-[mdi--information-outline] w-5 h-5" aria-hidden="true" />
            <div>
              <p className="text-sm">
                {hasDeliveredMessages
                  ? '配信済みの通知を削除します。メッセージも削除する場合は上のチェックボックスをオンにしてください。'
                  : 'この通知は論理削除されます。一覧には表示されなくなります。'}
              </p>
            </div>
          </div>

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
