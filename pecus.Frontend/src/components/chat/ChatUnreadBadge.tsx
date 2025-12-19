'use client';

import { useChatStore } from '@/stores/chatStore';

/**
 * 未読バッジコンポーネント
 * APIから取得した件数をそのまま表示（フロントで小細工しない）
 */
export default function ChatUnreadBadge() {
  const { unreadCounts } = useChatStore();

  if (unreadCounts.total === 0) {
    return null;
  }

  const displayCount = unreadCounts.total > 99 ? '99+' : unreadCounts.total.toString();

  return (
    <span className="badge badge-error badge-xs absolute -top-1 -right-1 min-w-4 h-4 text-[10px] font-bold">
      {displayCount}
    </span>
  );
}
