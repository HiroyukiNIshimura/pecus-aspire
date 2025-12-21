'use client';

import { useCallback, useEffect, useState } from 'react';
import { createOrGetAiRoom, createOrGetDmRoom, getDmCandidateUsers } from '@/actions/chat';
import type { ChatRoomItem, DmCandidateUserItem } from '@/connectors/api/pecus';
import { type ChatTab, useChatStore } from '@/stores/chatStore';
import ChatRoomListItem from './ChatRoomListItem';
import DmCandidateUserListItem from './DmCandidateUserListItem';
import DmUserSearchModal from './DmUserSearchModal';

interface ChatRoomListProps {
  rooms: ChatRoomItem[];
  loading?: boolean;
  onRoomCreated?: () => void;
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
export default function ChatRoomList({ rooms, loading = false, onRoomCreated }: ChatRoomListProps) {
  const { activeTab, setActiveTab, selectedRoomId, selectRoom, unreadCounts } = useChatStore();
  const [dmCandidates, setDmCandidates] = useState<DmCandidateUserItem[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [startingDm, setStartingDm] = useState<number | null>(null);
  const [startingAi, setStartingAi] = useState(false);

  // DM候補ユーザーを取得
  const fetchDmCandidates = useCallback(async () => {
    if (activeTab !== 'dm') return;
    setCandidatesLoading(true);
    try {
      const result = await getDmCandidateUsers(10);
      if (result.success) {
        setDmCandidates(result.data);
      }
    } finally {
      setCandidatesLoading(false);
    }
  }, [activeTab]);

  // DMタブに切り替えた時にDM候補を取得
  useEffect(() => {
    if (activeTab === 'dm') {
      fetchDmCandidates();
    }
  }, [activeTab, fetchDmCandidates]);

  // DM候補ユーザーをクリックしてDM開始
  const handleStartDm = async (userId: number) => {
    setStartingDm(userId);
    try {
      const result = await createOrGetDmRoom(userId);
      if (result.success) {
        selectRoom(result.data.id);
        // DM候補リストから削除（既存DMになったため）
        setDmCandidates((prev) => prev.filter((u) => u.id !== userId));
        onRoomCreated?.();
      }
    } finally {
      setStartingDm(null);
    }
  };

  // 検索モーダルからのDM開始
  const handleSearchDmStart = async (userId: number) => {
    setIsSearchModalOpen(false);
    await handleStartDm(userId);
  };

  // AIアシスタントとのチャットを開始
  const handleStartAiChat = async () => {
    setStartingAi(true);
    try {
      const result = await createOrGetAiRoom();
      if (result.success) {
        selectRoom(result.data.id);
        onRoomCreated?.();
      }
    } finally {
      setStartingAi(false);
    }
  };

  // タブに応じたルームをフィルタリング
  const filteredRooms = rooms.filter((room) => {
    switch (activeTab) {
      case 'dm':
        // DM と AI ルーム（個人向けアシスタント）を表示
        return room.type === 'Dm' || room.type === 'Ai';
      case 'group':
        return room.type === 'Group';
      case 'system':
        return room.type === 'System';
      default:
        return true;
    }
  });

  // タブごとの未読数を取得
  const getTabUnreadCount = (tab: ChatTab): number => {
    switch (tab) {
      case 'dm':
        // DM と AI の未読数を合算
        return unreadCounts.dm + unreadCounts.ai;
      case 'group':
        return unreadCounts.group;
      case 'system':
        return unreadCounts.system;
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
        ) : (
          <>
            {/* 既存ルーム */}
            {filteredRooms.length === 0 && activeTab !== 'dm' && (
              <div className="flex items-center justify-center h-32 text-base-content/50">
                {activeTab === 'group' && 'グループはありません'}
                {activeTab === 'system' && '通知はありません'}
              </div>
            )}
            {filteredRooms.map((room) => (
              <ChatRoomListItem
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => selectRoom(room.id)}
              />
            ))}

            {/* DMタブ: 他のメンバーセクション */}
            {activeTab === 'dm' && (
              <>
                {filteredRooms.length === 0 &&
                  dmCandidates.length === 0 &&
                  !candidatesLoading &&
                  !rooms.some((r) => r.type === 'Ai') && (
                    <div className="flex items-center justify-center h-32 text-base-content/50">DMはありません</div>
                  )}

                {/* AI アシスタントボタン（AI ルームが無い場合のみ表示） */}
                {!rooms.some((r) => r.type === 'Ai') && (
                  <div className="p-3 border-b border-base-300">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm w-full"
                      onClick={handleStartAiChat}
                      disabled={startingAi}
                    >
                      {startingAi ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <span className="icon-[tabler--robot] size-4" aria-hidden="true" />
                      )}
                      AI アシスタントと話す
                    </button>
                  </div>
                )}

                {/* セパレーター */}
                {dmCandidates.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-base-content/50">
                    <div className="flex-1 h-px bg-base-300" />
                    <span>他のメンバー</span>
                    <div className="flex-1 h-px bg-base-300" />
                  </div>
                )}

                {/* DM候補ユーザー一覧 */}
                {candidatesLoading ? (
                  <div className="flex items-center justify-center h-16">
                    <span className="loading loading-spinner loading-sm" />
                  </div>
                ) : (
                  dmCandidates.map((user) => (
                    <DmCandidateUserListItem
                      key={user.id}
                      user={user}
                      onClick={() => handleStartDm(user.id)}
                      loading={startingDm === user.id}
                    />
                  ))
                )}

                {/* 他のユーザーを探すボタン */}
                <div className="p-3 border-t border-base-300">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm w-full"
                    onClick={() => setIsSearchModalOpen(true)}
                  >
                    <span className="icon-[tabler--search] size-4" aria-hidden="true" />
                    他のユーザーを探す
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ユーザー検索モーダル */}
      <DmUserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectUser={handleSearchDmStart}
        existingDmUserIds={filteredRooms
          .filter((r) => r.type === 'Dm')
          .map((r) => r.otherUser?.id)
          .filter((id): id is number => id !== undefined)}
      />
    </div>
  );
}
