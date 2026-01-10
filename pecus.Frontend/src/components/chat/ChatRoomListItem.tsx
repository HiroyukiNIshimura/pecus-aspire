'use client';

import type { ChatRoomItem } from '@/connectors/api/pecus';
import { formatRelativeTime } from '@/libs/utils/date';

interface ChatRoomListItemProps {
  room: ChatRoomItem;
  isSelected?: boolean;
  onClick: () => void;
}

/**
 * ルーム一覧の1行コンポーネント
 */
export default function ChatRoomListItem({ room, isSelected = false, onClick }: ChatRoomListItemProps) {
  // ルームタイプに応じたアイコン
  const getRoomIcon = () => {
    switch (room.type) {
      case 'Dm':
        return 'icon-[tabler--user]';
      case 'Group':
        return 'icon-[tabler--users]';
      case 'Ai':
        return 'icon-[tabler--robot]';
      case 'System':
        return 'icon-[tabler--bell]';
      default:
        return 'icon-[tabler--message]';
    }
  };

  // ルーム名の取得
  const getRoomName = () => {
    if (room.type === 'Dm' && room.otherUser) {
      return room.otherUser.username;
    }
    return room.name || 'ルーム';
  };

  // 最新メッセージのプレビュー
  const getLatestMessagePreview = () => {
    if (!room.latestMessage) {
      return 'メッセージはありません';
    }
    const content = room.latestMessage.content;
    return content.length > 30 ? `${content.slice(0, 30)}...` : content;
  };

  // 最新メッセージの時間
  const getLatestMessageTime = () => {
    if (!room.latestMessage?.createdAt) {
      return '';
    }
    return formatRelativeTime(room.latestMessage.createdAt);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 hover:bg-base-200 transition-colors border-b border-base-200 ${
        isSelected ? 'bg-base-200' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* アイコン */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral flex items-center justify-center">
          {room.type === 'Dm' && room.otherUser?.identityIconUrl ? (
            <img
              src={room.otherUser.identityIconUrl}
              alt={room.otherUser.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <span className={`${getRoomIcon()} size-5 text-neutral-content`} aria-hidden="true" />
          )}
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate">{getRoomName()}</span>
            <span className="text-xs text-base-content/50 flex-shrink-0">{getLatestMessageTime()}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-sm text-base-content/70 truncate">{getLatestMessagePreview()}</span>
            {room.unreadCount && room.unreadCount > 0 && (
              <span className="badge badge-primary badge-sm flex-shrink-0">
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
