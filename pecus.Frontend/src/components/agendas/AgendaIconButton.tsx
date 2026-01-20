'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchNotificationCount } from '@/actions/agenda';

/**
 * ヘッダーのアジェンダアイコンボタン
 * 未読通知・未回答招待をバッジで表示
 */
export default function AgendaIconButton() {
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const result = await fetchNotificationCount();
      if (result.success) {
        // 未読通知数 + 未回答招待数の合計を表示
        setTotalCount(result.data.total ?? 0);
      }
    };

    loadCount();

    // 1分ごとに更新
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  //TODO : /agendasではなく通知一覧UIの表示に変更する
  return (
    <Link href="/agendas" className="btn btn-text btn-circle relative" aria-label="予定">
      <span className="icon-[tabler--calendar-event] size-6" aria-hidden="true" />
      {totalCount > 0 && (
        <span className="badge badge-error badge-xs absolute -top-1 -right-1 min-w-4 px-1">
          {totalCount > 99 ? '99+' : totalCount}
        </span>
      )}
    </Link>
  );
}
