'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchUpcomingNotificationCount } from '@/actions/agenda';

/**
 * ヘッダーのアジェンダアイコンボタン
 * 直近の予定通知をバッジで表示
 */
export default function AgendaIconButton() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const result = await fetchUpcomingNotificationCount();
      if (result.success) {
        setUnreadCount(result.data);
      }
    };

    loadCount();

    // 1分ごとに更新
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/agendas" className="btn btn-text btn-circle relative" aria-label="予定">
      <span className="icon-[tabler--calendar-event] size-6" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="badge badge-error badge-xs absolute -top-1 -right-1 min-w-4 px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
