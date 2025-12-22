'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createOrGetAiRoom,
  createOrGetDmRoom,
  getChatRooms,
  getChatUnreadCounts,
  getDmCandidateUsers,
  searchUsers,
} from '@/actions/chat';
import type { ChatRoomItem, DmCandidateUserItem, UserSearchResultResponse } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSignalREvent } from '@/hooks/useSignalR';
import { formatRelativeTime } from '@/libs/utils/date';
import { useIsAiEnabled } from '@/providers/AppSettingsProvider';
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
    messageType: string;
    content: string;
    replyToMessageId?: number;
    createdAt: string;
    sender?: {
      id: number;
      username: string;
      email: string;
      avatarType?: string;
      identityIconUrl?: string;
      isActive: boolean;
    };
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
        <ChatRoomListMobile rooms={rooms} onRoomSelect={handleRoomSelect} onRoomCreated={fetchRooms} />
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
  onRoomCreated,
}: {
  rooms: ChatRoomItem[];
  onRoomSelect: (roomId: number) => void;
  onRoomCreated?: () => void;
}) {
  const { activeTab, setActiveTab, unreadCounts, selectRoom } = useChatStore();
  const router = useRouter();
  const isAiEnabled = useIsAiEnabled();
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
        setDmCandidates((prev) => prev.filter((u) => u.id !== userId));
        onRoomCreated?.();
        // スマホでは直接メッセージ画面へ遷移
        router.push(`/chat/rooms/${result.data.id}`);
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
        router.push(`/chat/rooms/${result.data.id}`);
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

  const tabs = [
    { key: 'dm' as const, label: 'DM', icon: 'icon-[tabler--user]', count: unreadCounts.dm + unreadCounts.ai },
    { key: 'group' as const, label: 'グループ', icon: 'icon-[tabler--users]', count: unreadCounts.group },
    {
      key: 'system' as const,
      label: '通知',
      icon: 'icon-[tabler--bell]',
      count: unreadCounts.system,
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
        {/* 既存ルーム */}
        {filteredRooms.length === 0 && activeTab !== 'dm' && (
          <div className="flex items-center justify-center h-32 text-base-content/50">
            {activeTab === 'group' && 'グループはありません'}
            {activeTab === 'system' && '通知はありません'}
          </div>
        )}
        {filteredRooms.map((room) => (
          <ChatRoomListItemMobile key={room.id} room={room} onClick={() => onRoomSelect(room.id)} />
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

            {/* AI アシスタントボタン（AI機能有効かつAIルームが無い場合のみ表示） */}
            {isAiEnabled && !rooms.some((r) => r.type === 'Ai') && (
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
                <DmCandidateUserListItemMobile
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
      </div>

      {/* ユーザー検索モーダル */}
      <DmUserSearchModalMobile
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

/**
 * スマホ用DM候補ユーザーリストアイテム
 */
function DmCandidateUserListItemMobile({
  user,
  onClick,
  loading,
}: {
  user: DmCandidateUserItem;
  onClick: () => void;
  loading?: boolean;
}) {
  const lastActiveText = user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-base-200 active:bg-base-300 transition-colors text-left disabled:opacity-50 border-b border-base-200"
    >
      <div className="relative shrink-0">
        {user.identityIconUrl ? (
          <img src={user.identityIconUrl} alt="" className="size-10 rounded-full object-cover" />
        ) : (
          <div className="size-10 rounded-full bg-base-300 flex items-center justify-center">
            <span className="icon-[tabler--user] size-5 text-base-content/50" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{user.username}</span>
          {lastActiveText && <span className="text-xs text-base-content/50 shrink-0">{lastActiveText}</span>}
        </div>
      </div>
      {loading && <span className="loading loading-spinner loading-xs" />}
    </button>
  );
}

/**
 * スマホ用ユーザー検索モーダル
 */
function DmUserSearchModalMobile({
  isOpen,
  onClose,
  onSelectUser,
  existingDmUserIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: number) => void;
  existingDmUserIds: number[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResultResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      const result = await searchUsers(searchQuery, 20);
      if (result.success) {
        const filtered = result.data.filter((u) => u.id && !existingDmUserIds.includes(u.id));
        setResults(filtered);
      } else {
        setError(result.error || '検索に失敗しました');
        setResults([]);
      }
      setLoading(false);
    },
    [existingDmUserIds],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-base-100 rounded-t-box w-full max-h-[80vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-base-300 shrink-0">
          <h2 className="text-lg font-bold">ユーザーを検索</h2>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" aria-label="閉じる" onClick={onClose}>
            <span className="icon-[tabler--x] size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 border-b border-base-300 shrink-0">
          <div className="relative">
            <span className="icon-[tabler--search] size-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
            <input
              type="text"
              className="input input-bordered w-full pl-10"
              placeholder="名前またはメールで検索..."
              value={query}
              onChange={handleInputChange}
            />
            {loading && (
              <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>
          {query.length > 0 && query.length < 2 && (
            <p className="text-xs text-base-content/50 mt-1">2文字以上入力してください</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4">
              <div className="alert alert-error alert-soft">
                <span>{error}</span>
              </div>
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && !error && (
            <div className="flex items-center justify-center h-32 text-base-content/50">該当するユーザーがいません</div>
          )}
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 active:bg-base-300 transition-colors text-left border-b border-base-200"
              onClick={() => user.id && onSelectUser(user.id)}
            >
              <div className="shrink-0">
                {user.identityIconUrl ? (
                  <img src={user.identityIconUrl} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-base-300 flex items-center justify-center">
                    <span className="icon-[tabler--user] size-5 text-base-content/50" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user.username}</div>
                <div className="text-xs text-base-content/50 truncate">{user.email}</div>
              </div>
            </button>
          ))}
          {!loading && query.length === 0 && (
            <div className="flex items-center justify-center h-32 text-base-content/50">
              ユーザー名またはメールで検索
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
