'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { issueDeviceTicket, sendDeviceTicketEmail } from '@/actions/webauthn';
import { formatDateTime } from '@/libs/utils/date';

interface DeviceLinkModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じる際のコールバック */
  onClose: () => void;
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

interface DeviceTicketState {
  setupUrl: string;
  expiresAt?: string;
}

/**
 * 別の端末にパスキーを追加するためのモーダル
 *
 * ログイン済みの端末でチケットを発行し、QR コードまたはメールで新しい端末へ渡す。
 * 未ログインの端末ではプロフィールを開けないため、この導線が 2 台目以降の登録手段になる。
 */
export default function DeviceLinkModal({ isOpen, onClose, notify }: DeviceLinkModalProps) {
  const [ticket, setTicket] = useState<DeviceTicketState | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueTicket = useCallback(async () => {
    setIsIssuing(true);
    setError(null);
    try {
      const result = await issueDeviceTicket();
      if (!result.success) {
        setTicket(null);
        setError(result.message || '端末追加の準備に失敗しました。');
        return;
      }
      setTicket({ setupUrl: result.data.setupUrl, expiresAt: result.data.expiresAt ?? undefined });
    } finally {
      setIsIssuing(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTicket(null);
      setError(null);
      return;
    }

    void issueTicket();
  }, [isOpen, issueTicket]);

  // body スクロール制御
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isIssuing && !isSendingEmail) {
      onClose();
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setError(null);
    try {
      const result = await sendDeviceTicketEmail();
      if (!result.success) {
        setError(result.message || 'メールの送信に失敗しました。');
        return;
      }
      notify.success(result.data.message || '登録用のリンクをメールで送信しました。');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const isBusy = isIssuing || isSendingEmail;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-link-modal-title"
    >
      <div className="bg-base-100 rounded-box shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <span className="icon-[tabler--devices] size-6" aria-hidden="true" />
            </div>
            <h2 id="device-link-modal-title" className="text-lg font-bold">
              別の端末で追加
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary btn-circle"
            onClick={handleClose}
            disabled={isBusy}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <p className="text-sm text-base-content/70">
            追加したい端末のカメラで QR コードを読み取るか、メールで届くリンクをその端末で開いてください。
            リンクを開いた端末にはパスキーが登録され、そのままログイン状態になります。
          </p>

          {isIssuing && (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-lg" aria-label="読み込み中" />
            </div>
          )}

          {!isIssuing && ticket && (
            <>
              <div className="flex justify-center py-4">
                <div className="rounded-box bg-white p-4" aria-label="端末追加用の QR コード">
                  <QRCode value={ticket.setupUrl} size={200} />
                </div>
              </div>

              <div className="form-control w-full">
                <label htmlFor="deviceLinkUrl" className="label">
                  <span className="label-text font-semibold">登録用 URL</span>
                </label>
                <input
                  id="deviceLinkUrl"
                  name="deviceLinkUrl"
                  type="text"
                  className="input input-bordered w-full text-xs"
                  value={ticket.setupUrl}
                  readOnly
                  onFocus={(event) => event.currentTarget.select()}
                />
              </div>

              {ticket.expiresAt && (
                <p className="mt-2 text-sm text-base-content/70">
                  有効期限: {formatDateTime(ticket.expiresAt)}（1 回だけ使えます）
                </p>
              )}
            </>
          )}

          {error && (
            <div className="alert alert-soft alert-error mt-4" role="alert">
              <span>{error}</span>
            </div>
          )}

          <div className="alert alert-soft alert-info mt-4" role="status">
            <span className="icon-[tabler--info-circle] size-5 shrink-0" aria-hidden="true" />
            <span>他の端末のパスキーとログイン状態はそのまま残ります。</span>
          </div>

          <div className="flex flex-wrap gap-2 justify-end pt-4 mt-4 border-t border-base-300">
            <button type="button" className="btn btn-outline" onClick={issueTicket} disabled={isBusy}>
              <span className="icon-[tabler--refresh] size-5" aria-hidden="true" />
              再発行
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSendEmail} disabled={isBusy}>
              {isSendingEmail ? (
                <>
                  <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                  送信中...
                </>
              ) : (
                <>
                  <span className="icon-[tabler--mail] size-5" aria-hidden="true" />
                  メールで送る
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
