'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { fetchNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/actions/agenda';
import type { AgendaNotificationResponse, AgendaNotificationType } from '@/connectors/api/pecus';
import { formatRelativeTime } from '@/libs/utils/date';

/**
 * 通知ポップアップのProps
 */
export interface AgendaNotificationPopupProps {
  /** ポップアップ表示状態 */
  isOpen: boolean;
  /** 閉じるコールバック */
  onClose: () => void;
  /** アンカー要素の位置情報 */
  anchorRect?: DOMRect | null;
  /** 通知件数が変更されたときのコールバック */
  onCountChange?: () => void;
}

/** 通知タイプごとのアイコン設定 */
const notificationTypeConfig: Record<AgendaNotificationType, { icon: string; label: string; color: string }> = {
  Invited: { icon: 'icon-[mdi--email-plus]', label: '新規招待', color: 'text-info' },
  SeriesUpdated: { icon: 'icon-[mdi--pencil]', label: '変更', color: 'text-warning' },
  SeriesCancelled: { icon: 'icon-[mdi--cancel]', label: '中止', color: 'text-error' },
  OccurrenceUpdated: { icon: 'icon-[mdi--pencil]', label: '変更', color: 'text-warning' },
  OccurrenceCancelled: { icon: 'icon-[mdi--cancel]', label: '中止', color: 'text-error' },
  Reminder: { icon: 'icon-[mdi--alarm]', label: 'リマインダー', color: 'text-accent' },
  AddedToEvent: { icon: 'icon-[mdi--account-plus]', label: '参加者追加', color: 'text-success' },
  RemovedFromEvent: { icon: 'icon-[mdi--account-minus]', label: '参加者削除', color: 'text-error' },
  AttendanceDeclined: { icon: 'icon-[mdi--account-cancel]', label: '不参加', color: 'text-warning' },
};

/** デフォルトの通知タイプ設定（フォールバック用） */
const defaultNotificationConfig = { icon: 'icon-[mdi--bell]', label: '通知', color: 'text-base-content' };

/**
 * 通知タイプに応じた説明文を生成
 */
function getNotificationDescription(
  type: AgendaNotificationType | undefined,
  createdByUser: { username?: string | null } | null | undefined,
  message?: string | null,
): string | null {
  if (!type) return null;

  const username = createdByUser?.username ?? '誰か';

  switch (type) {
    case 'Invited':
      return `${username}さんが招待しました`;
    case 'SeriesUpdated':
      return `${username}さんがイベントを更新しました`;
    case 'SeriesCancelled':
      return `${username}さんがイベントを中止しました`;
    case 'OccurrenceUpdated':
      return `${username}さんがこの回を変更しました`;
    case 'OccurrenceCancelled':
      return `${username}さんがこの回を中止しました`;
    case 'Reminder':
      return message ?? 'リマインダー';
    case 'AddedToEvent':
      return `${username}さんがあなたを追加しました`;
    case 'RemovedFromEvent':
      return `${username}さんがあなたを削除しました`;
    case 'AttendanceDeclined':
      return `${username}さんが不参加に変更しました`;
    default:
      return null;
  }
}

/**
 * 日時をフォーマット
 */
function formatNotificationDate(dateString?: string): string {
  if (!dateString) return '';
  return formatRelativeTime(dateString);
}

/**
 * イベント開始日時をフォーマット
 */
function formatOccurrenceDate(dateString?: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * アジェンダ通知ポップアップ
 * - AppHeaderのアジェンダアイコンをクリックすると表示
 * - 未読通知を最大5件表示
 * - 個別既読・一括既読・一覧ページ遷移機能
 */
export default function AgendaNotificationPopup({
  isOpen,
  onClose,
  anchorRect,
  onCountChange,
}: AgendaNotificationPopupProps) {
  const [notifications, setNotifications] = useState<AgendaNotificationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // ポップアップ表示時にデータ取得
  useEffect(() => {
    if (!isOpen) return;

    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);

      const result = await fetchNotifications(5, undefined, true);
      if (result.success) {
        setNotifications(result.data);
      } else {
        setError(result.message ?? '通知の取得に失敗しました');
      }
      setIsLoading(false);
    };

    loadNotifications();
  }, [isOpen]);

  // 外部クリックで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // 少し遅延させてクリックイベントを登録（トリガー要素のクリックを無視するため）
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  /**
   * 個別通知をクリック（既読にして詳細ページへ遷移）
   */
  const handleNotificationClick = async (notification: AgendaNotificationResponse) => {
    if (!notification.isRead && notification.id) {
      await markNotificationAsRead(notification.id);
      onCountChange?.();
    }
    onClose();
  };

  /**
   * すべて既読にする
   */
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;

    setIsMarkingAll(true);
    const unreadIds = notifications.filter((n) => !n.isRead && n.id).map((n) => n.id!);

    if (unreadIds.length > 0) {
      const result = await markAllNotificationsAsRead(unreadIds);
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        onCountChange?.();
      }
    }
    setIsMarkingAll(false);
  };

  /**
   * 通知タイプの設定を取得
   */
  const getTypeConfig = (type?: AgendaNotificationType) => {
    if (!type) return defaultNotificationConfig;
    return notificationTypeConfig[type] ?? defaultNotificationConfig;
  };

  /**
   * 通知アイテムのリンク先を取得
   */
  const getNotificationLink = (notification: AgendaNotificationResponse): string => {
    // 特定回の通知の場合はoccurrenceパラメータ付き
    if (notification.occurrenceStartAt) {
      return `/agendas/${notification.agendaId}?occurrence=${encodeURIComponent(notification.occurrenceStartAt)}`;
    }
    return `/agendas/${notification.agendaId}`;
  };

  if (!isOpen) return null;

  // ポップアップの位置計算
  const getPopupStyle = (): React.CSSProperties => {
    if (!anchorRect) {
      return {
        position: 'fixed',
        top: '60px',
        right: '16px',
      };
    }

    const popupWidth = 360;
    const margin = 8;
    const viewportWidth = window.innerWidth;

    // アンカーの下に表示
    const top = anchorRect.bottom + margin;
    let right = viewportWidth - anchorRect.right;

    // 右端からはみ出さないように調整
    if (right < margin) {
      right = margin;
    }

    // 左端からはみ出す場合
    if (viewportWidth - right - popupWidth < margin) {
      right = viewportWidth - popupWidth - margin;
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      right: `${right}px`,
    };
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <>
      {/* オーバーレイ（薄い背景） */}
      <div className="fixed inset-0 z-40" aria-hidden="true" />

      {/* ポップアップ本体 */}
      <div
        ref={popupRef}
        className="z-50 bg-base-100 rounded-box shadow-xl w-90 max-h-96 flex flex-col border border-base-300"
        style={getPopupStyle()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agenda-notifications-title"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
          <h3 id="agenda-notifications-title" className="font-semibold text-base-content flex items-center gap-2">
            <span className="icon-[mdi--bell] size-5" aria-hidden="true" />
            通知
            {notifications.length > 0 && (
              <span className="badge badge-sm badge-secondary">{notifications.length}件</span>
            )}
          </h3>
          {hasUnread && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
              className="btn btn-xs btn-secondary"
            >
              {isMarkingAll ? <span className="loading loading-spinner loading-xs" /> : 'すべて既読'}
            </button>
          )}
        </div>

        {/* 通知一覧 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-error">
              <span className="icon-[mdi--alert-circle] size-6 mb-2" aria-hidden="true" />
              <p className="text-sm">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-base-content/60">
              <span className="icon-[mdi--bell-off] size-10 mb-2" aria-hidden="true" />
              <p className="text-sm">新しい通知はありません</p>
            </div>
          ) : (
            <ul className="divide-y divide-base-200">
              {notifications.map((notification) => {
                const typeConfig = getTypeConfig(notification.type);
                const description = getNotificationDescription(
                  notification.type,
                  notification.createdBy,
                  notification.message,
                );
                return (
                  <li key={notification.id}>
                    <Link
                      href={getNotificationLink(notification)}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-3 p-3 hover:bg-base-200 transition-colors ${
                        !notification.isRead ? 'bg-base-200/50' : ''
                      }`}
                    >
                      {/* 通知タイプアイコン */}
                      <div className={`flex-shrink-0 mt-0.5 ${typeConfig.color}`}>
                        <span className={`${typeConfig.icon} size-5`} aria-hidden="true" />
                      </div>

                      {/* 通知内容 */}
                      <div className="flex-1 min-w-0">
                        {/* 通知タイプに応じた説明文 */}
                        {description && <p className="text-xs text-base-content/70 mb-0.5">{description}</p>}
                        <p className="text-sm font-medium text-base-content truncate">{notification.agendaTitle}</p>
                        {notification.message && (
                          <p className="text-xs text-base-content/70 line-clamp-2 mt-0.5">{notification.message}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-base-content/50">
                          {notification.occurrenceStartAt && (
                            <span>{formatOccurrenceDate(notification.occurrenceStartAt)}</span>
                          )}
                          {notification.createdAt && <span>{formatNotificationDate(notification.createdAt)}</span>}
                        </div>
                      </div>

                      {/* 未読インジケーター */}
                      {!notification.isRead && (
                        <div className="flex-shrink-0">
                          <span className="block w-2 h-2 rounded-full bg-info" />
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-base-300 p-2">
          <Link href="/agendas" onClick={onClose} className="btn btn-secondary btn-sm w-full">
            <span className="icon-[mdi--calendar-event] size-4" aria-hidden="true" />
            イベント一覧を見る
          </Link>
        </div>
      </div>
    </>
  );
}
