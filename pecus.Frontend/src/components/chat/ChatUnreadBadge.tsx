'use client';

import { useChatStore } from '@/stores/chatStore';

/**
 * 未読バッジコンポーネント
 * APIから取得した件数をそのまま表示（フロントで小細工しない）
 */
export default function ChatUnreadBadge() {
  const { unreadCounts, mentionUnreadCount } = useChatStore();

  const effectiveUnreadCount = Math.max(unreadCounts.total, mentionUnreadCount);

  if (effectiveUnreadCount === 0) {
    return null;
  }

  const displayCount = effectiveUnreadCount > 99 ? '99+' : effectiveUnreadCount.toString();

  return (
    <span className="badge badge-error badge-xs absolute -top-1 -right-1 min-w-4 h-4 text-[10px] font-bold">
      {displayCount}
    </span>
  );
}
