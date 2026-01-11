'use client';

import { useCallback, useEffect, useState } from 'react';
import { getChatRooms, getChatUnreadCounts } from '@/actions/chat';
import type { ChatRoomItem } from '@/connectors/api/pecus';
import { useSignalREvent } from '@/hooks/useSignalR';
import { useChatStore } from '@/stores/chatStore';
import ChatBottomDrawer from './ChatBottomDrawer';

interface ChatProviderProps {
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

/** SignalR chat:unread_updated イベントのペイロード型 */
interface ChatUnreadUpdatedPayload {
  roomId: number;
  roomType: string;
  // メッセージ送信時
  senderUserId?: number;
  // 既読更新時
  updatedByUserId?: number;
  updateType?: 'message' | 'read';
}

/**
 * チャット用プロバイダー
 * - ルーム一覧と未読数を取得
 * - SignalR で新メッセージ受信時に未読数を更新
 * - PC用のボトムドロワーを表示（md以上で表示、スマホは hidden）
 */
export default function ChatProvider({ currentUserId }: ChatProviderProps) {
  const { isDrawerOpen, setUnreadCounts } = useChatStore();
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ルーム一覧を取得
  const fetchRooms = useCallback(async () => {
    console.log('[ChatProvider] fetchRooms called');
    setLoading(true);
    try {
      const result = await getChatRooms();
      console.log('[ChatProvider] getChatRooms result:', result);
      if (result.success && result.data) {
        setRooms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 未読数を取得
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

  // 初回マウント時に未読数を取得
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // ドロワーが開いた時にルーム一覧を取得
  useEffect(() => {
    if (isDrawerOpen) {
      fetchRooms();
    }
  }, [isDrawerOpen, fetchRooms]);

  // SignalR: 新メッセージ受信時に未読数を更新（チャット画面を開いている時）
  // 自分が送信したメッセージの場合は未読数を更新しない
  const handleMessageReceived = useCallback(
    (payload: ChatMessageReceivedPayload) => {
      // 自分が送信したメッセージは未読数に影響しない
      if (payload.message.senderUserId === currentUserId) {
        return;
      }
      // ドロワーが開いていればルーム一覧も更新
      if (isDrawerOpen) {
        fetchRooms();
      }
      // 未読数を再取得
      fetchUnreadCounts();
    },
    [currentUserId, fetchUnreadCounts, fetchRooms, isDrawerOpen],
  );

  useSignalREvent<ChatMessageReceivedPayload>('chat:message_received', handleMessageReceived);

  // SignalR: 未読バッジ更新通知（チャット画面を開いていなくても受信）
  // organization グループに送信されるため、全ユーザーが受信可能
  const handleUnreadUpdated = useCallback(
    (payload: ChatUnreadUpdatedPayload) => {
      console.log('[ChatProvider] chat:unread_updated received:', payload);

      // 既読更新の場合は自分自身の更新のみ処理
      if (payload.updateType === 'read') {
        if (payload.updatedByUserId === currentUserId) {
          fetchUnreadCounts();
          if (isDrawerOpen) {
            fetchRooms();
          }
        }
        return;
      }

      // メッセージ送信の場合は自分が送信したメッセージは無視
      if (payload.senderUserId === currentUserId) {
        return;
      }
      // 未読数を再取得
      console.log('[ChatProvider] Fetching unread counts...');
      fetchUnreadCounts();
      // ルーム一覧も更新（新規ルームが作成された場合に対応）
      fetchRooms();
    },
    [currentUserId, fetchUnreadCounts, fetchRooms],
  );

  useSignalREvent<ChatUnreadUpdatedPayload>('chat:unread_updated', handleUnreadUpdated);

  // ドロワーは常にレンダリング（CSS で md 以上のみ表示）
  return <ChatBottomDrawer rooms={rooms} currentUserId={currentUserId} loading={loading} onRoomCreated={fetchRooms} />;
}
