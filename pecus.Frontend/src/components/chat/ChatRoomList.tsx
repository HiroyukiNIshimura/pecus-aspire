'use client';

import type { ChatRoomItem } from '@/connectors/api/pecus';
import { type ChatTab, useChatStore } from '@/stores/chatStore';
import ChatRoomListItem from './ChatRoomListItem';

interface ChatRoomListProps {
  rooms: ChatRoomItem[];
  loading?: boolean;
}

/**
 * タブ情報
 */
const tabs: { key: ChatTab; label: string; icon: string }[] = [
  { key: 'dm', label: 'DM', icon: 'icon-[tabler--user]' },
  { key: 'group', label: 'グループ', icon: 'icon-[tabler--users]' },
  { key: 'system', label: '通知', icon: 'icon-[tabler--bell]' },
];

/**
 * ルーム一覧コンポーネント（タブ付き）
 */
export default function ChatRoomList({ rooms, loading = false }: ChatRoomListProps) {
  const { activeTab, setActiveTab, selectedRoomId, selectRoom, unreadCounts } = useChatStore();

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

  // タブごとの未読数を取得
  const getTabUnreadCount = (tab: ChatTab): number => {
    switch (tab) {
      case 'dm':
        return unreadCounts.dm;
      case 'group':
        return unreadCounts.group;
      case 'system':
        return unreadCounts.system + unreadCounts.ai;
      default:
        return 0;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* タブ */}
      <div className="flex border-b border-base-300">
        {tabs.map((tab) => {
          const unreadCount = getTabUnreadCount(tab.key);
          return (
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
              {unreadCount > 0 && (
                <span className="badge badge-error badge-xs ml-1">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ルーム一覧 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="loading loading-spinner loading-md" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-base-content/50">
            {activeTab === 'dm' && 'DMはありません'}
            {activeTab === 'group' && 'グループはありません'}
            {activeTab === 'system' && '通知はありません'}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <ChatRoomListItem
              key={room.id}
              room={room}
              isSelected={selectedRoomId === room.id}
              onClick={() => selectRoom(room.id)}
            />
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
