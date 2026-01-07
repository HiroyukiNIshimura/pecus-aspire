'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getChatRooms, getChatUnreadCounts } from '@/actions/chat';
import ChatRoomList from '@/components/chat/ChatRoomList';
import type { ChatRoomItem } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSignalREvent } from '@/hooks/useSignalR';
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

  // 画面がアクティブになった時（ルームから戻った時など）にデータを再取得
  useEffect(() => {
    // マウント時に最新データを取得（ルームから戻った場合に対応）
    fetchRooms();
    fetchUnreadCounts();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRooms();
        fetchUnreadCounts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchRooms, fetchUnreadCounts]);

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
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-base-100">
      {/* ヘッダー */}
      <div className="flex items-center px-4 py-3 border-b border-base-300 bg-base-200 shrink-0">
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

      {/* ルーム一覧（共通コンポーネントを使用） */}
      <div className="flex-1 overflow-hidden">
        <ChatRoomList rooms={rooms} onRoomSelect={handleRoomSelect} onRoomCreated={fetchRooms} />
      </div>
    </div>
  );
}
