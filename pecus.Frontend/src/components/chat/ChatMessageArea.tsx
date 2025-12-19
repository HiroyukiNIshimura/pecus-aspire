'use client';

import { useCallback, useEffect, useState } from 'react';
import { getChatMessages, getChatRoomDetail, sendChatMessage, updateReadPosition } from '@/actions/chat';
import type { ChatMessageItem, ChatRoomDetailResponse } from '@/connectors/api/pecus';
import ChatMessageInput from './ChatMessageInput';
import ChatMessageList from './ChatMessageList';

interface ChatMessageAreaProps {
  roomId: number;
  currentUserId: number;
}

/**
 * メッセージエリアコンポーネント
 * - ルーム詳細とメッセージを取得
 * - メッセージ送信
 * - 既読位置の更新
 */
export default function ChatMessageArea({ roomId, currentUserId }: ChatMessageAreaProps) {
  const [room, setRoom] = useState<ChatRoomDetailResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  // ルーム詳細とメッセージを取得
  const fetchRoomAndMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [roomResult, messagesResult] = await Promise.all([getChatRoomDetail(roomId), getChatMessages(roomId)]);

      if (roomResult.success && roomResult.data) {
        setRoom(roomResult.data);
      }

      if (messagesResult.success && messagesResult.data) {
        setMessages(messagesResult.data.messages);
        setHasMore(messagesResult.data.hasMore ?? false);
        setNextCursor(messagesResult.data.nextCursor ?? null);

        // 現在時刻で既読位置を更新
        await updateReadPosition(roomId);
      }
    } catch (error) {
      console.error('Failed to fetch room and messages:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // 過去のメッセージを読み込み
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || !nextCursor) return;

    try {
      const result = await getChatMessages(roomId, 50, nextCursor);
      if (result.success && result.data) {
        setMessages((prev) => [...result.data!.messages, ...prev]);
        setHasMore(result.data.hasMore ?? false);
        setNextCursor(result.data.nextCursor ?? null);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [roomId, hasMore, nextCursor]);

  // メッセージ送信
  const handleSend = useCallback(
    async (content: string) => {
      setSending(true);
      try {
        const result = await sendChatMessage(roomId, content);
        if (result.success && result.data) {
          // 送信したメッセージを一覧に追加
          setMessages((prev) => [...prev, result.data!]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setSending(false);
      }
    },
    [roomId],
  );

  // roomId が変わったらデータを再取得
  useEffect(() => {
    fetchRoomAndMessages();
  }, [fetchRoomAndMessages]);

  // ルーム名を取得
  const getRoomName = () => {
    if (!room) return 'ルーム';
    if (room.type === 'Dm') {
      // DM の場合は自分以外のメンバーを取得
      const otherMember = room.members.find((m) => m.userId !== currentUserId);
      return otherMember?.username || 'ルーム';
    }
    return room.name || 'ルーム';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center px-4 py-2 border-b border-base-300 bg-base-200">
        <h3 className="font-medium truncate">{getRoomName()}</h3>
      </div>

      {/* メッセージ一覧 */}
      <ChatMessageList
        messages={messages}
        currentUserId={currentUserId}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
      />

      {/* 入力欄 */}
      <ChatMessageInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
