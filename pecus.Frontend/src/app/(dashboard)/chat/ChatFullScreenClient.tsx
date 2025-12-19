'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getChatRooms, getChatUnreadCounts } from '@/actions/chat';
import type { ChatRoomItem } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSignalREvent } from '@/hooks/useSignalR';
import { formatRelativeTime } from '@/libs/utils/date';
import { useChatStore } from '@/stores/chatStore';

interface ChatFullScreenClientProps {
  initialRooms: ChatRoomItem[];
  initialUnreadCounts: {
    total: number;
    dm: number;
    group: number;
    ai: number;
    system: number;
  };
  currentUserId: number;
}

/** SignalR chat:message_received イベントのペイロード型 */
interface ChatMessageReceivedPayload {
  roomId: number;
  roomType: string;
  message: {
    id: number;
    senderUserId: number;
    senderUsername?: string;
    messageType: string;
    content: string;
    replyToMessageId?: number;
    createdAt: string;
  };
}

/**
 * スマホ用チャットフル画面（ルーム一覧）
 */
export default function ChatFullScreenClient({
  initialRooms,
  initialUnreadCounts,
  currentUserId,
}: ChatFullScreenClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { setUnreadCounts, selectRoom } = useChatStore();
  const [rooms, setRooms] = useState<ChatRoomItem[]>(initialRooms);

  // PC表示時はダッシュボードへリダイレクト（ドロワーを使うため）
  // isMobile === null は初期化中なのでスキップ
  useEffect(() => {
    if (isMobile === false) {
      router.replace('/');
    }
  }, [isMobile, router]);

  // 未読数をストアに設定
  useEffect(() => {
    setUnreadCounts(initialUnreadCounts);
  }, [initialUnreadCounts, setUnreadCounts]);

  // ルーム一覧を再取得
  const fetchRooms = useCallback(async () => {
    try {
      const result = await getChatRooms();
      if (result.success && result.data) {
        setRooms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    }
  }, []);

  // 未読数を再取得
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const result = await getChatUnreadCounts();
      if (result.success && result.data) {
        setUnreadCounts({
          total: result.data.totalUnreadCount,
          dm: result.data.dmUnreadCount,
          group: result.data.groupUnreadCount,
          ai: result.data.aiUnreadCount,
          system: result.data.systemUnreadCount,
        });
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [setUnreadCounts]);

  // SignalR: 新メッセージ受信時にルーム一覧と未読数を更新
  const handleMessageReceived = useCallback(
    (payload: ChatMessageReceivedPayload) => {
      // 自分が送信したメッセージは未読数に影響しない
      if (payload.message.senderUserId === currentUserId) {
        return;
      }
      // ルーム一覧と未読数を再取得
      fetchRooms();
      fetchUnreadCounts();
    },
    [currentUserId, fetchRooms, fetchUnreadCounts],
  );

  useSignalREvent<ChatMessageReceivedPayload>('chat:message_received', handleMessageReceived);

  // ルーム選択時にメッセージ画面へ遷移
  const handleRoomSelect = (roomId: number) => {
    selectRoom(roomId);
    router.push(`/chat/rooms/${roomId}`);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-base-100">
      {/* ヘッダー */}
      <div className="flex items-center px-4 py-3 border-b border-base-300 bg-base-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm btn-circle mr-2"
          aria-label="戻る"
        >
          <span className="icon-[tabler--arrow-left] size-5" aria-hidden="true" />
        </button>
        <h1 className="font-semibold text-lg">チャット</h1>
      </div>

      {/* ルーム一覧 */}
      <div className="flex-1 overflow-hidden">
        <ChatRoomListMobile rooms={rooms} onRoomSelect={handleRoomSelect} />
      </div>
    </div>
  );
}

/**
 * スマホ用ルーム一覧（タップでルーム遷移）
 */
function ChatRoomListMobile({
  rooms,
  onRoomSelect,
}: {
  rooms: ChatRoomItem[];
  onRoomSelect: (roomId: number) => void;
}) {
  const { activeTab, setActiveTab, unreadCounts } = useChatStore();

  // タブに応じたルームをフィルタリング
  const filteredRooms = rooms.filter((room) => {
    switch (activeTab) {
      case 'dm':
        return room.type === 'Dm';
      case 'group':
        return room.type === 'Group';
      case 'system':
        return room.type === 'System' || room.type === 'Ai';
      default:
        return true;
    }
  });

  const tabs = [
    { key: 'dm' as const, label: 'DM', icon: 'icon-[tabler--user]', count: unreadCounts.dm },
    { key: 'group' as const, label: 'グループ', icon: 'icon-[tabler--users]', count: unreadCounts.group },
    {
      key: 'system' as const,
      label: '通知',
      icon: 'icon-[tabler--bell]',
      count: unreadCounts.system + unreadCounts.ai,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* タブ */}
      <div className="flex border-b border-base-300">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 px-2 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-base-content/70 hover:text-base-content'
            }`}
          >
            <span className={`${tab.icon} size-4 mr-1`} aria-hidden="true" />
            {tab.label}
            {tab.count > 0 && (
              <span className="badge badge-error badge-xs ml-1">{tab.count > 99 ? '99+' : tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ルーム一覧 */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-base-content/50">
            {activeTab === 'dm' && 'DMはありません'}
            {activeTab === 'group' && 'グループはありません'}
            {activeTab === 'system' && '通知はありません'}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <ChatRoomListItemMobile key={room.id} room={room} onClick={() => onRoomSelect(room.id)} />
          ))
        )}
      </div>

      {/* 新規DMボタン（DMタブ時のみ） */}
      {activeTab === 'dm' && (
        <div className="p-3 border-t border-base-300">
          <button type="button" className="btn btn-primary btn-sm w-full">
            <span className="icon-[tabler--plus] size-4" aria-hidden="true" />
            新規DM
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * スマホ用ルーム一覧アイテム
 */
function ChatRoomListItemMobile({ room, onClick }: { room: ChatRoomItem; onClick: () => void }) {
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

  const getRoomName = () => {
    if (room.type === 'Dm' && room.otherUser) {
      return room.otherUser.username;
    }
    return room.name || 'ルーム';
  };

  const getLatestMessagePreview = () => {
    if (!room.latestMessage) {
      return 'メッセージはありません';
    }
    const content = room.latestMessage.content;
    return content.length > 30 ? `${content.slice(0, 30)}...` : content;
  };

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
      className="w-full text-left p-3 hover:bg-base-200 active:bg-base-300 transition-colors border-b border-base-200"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-base-300 flex items-center justify-center">
          {room.type === 'Dm' && room.otherUser?.identityIconUrl ? (
            <img
              src={room.otherUser.identityIconUrl}
              alt={room.otherUser.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <span className={`${getRoomIcon()} size-5 text-base-content/70`} aria-hidden="true" />
          )}
        </div>

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
