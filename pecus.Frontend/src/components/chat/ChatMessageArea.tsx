'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getChatMessages, getChatRoomDetail, sendChatMessage, updateReadPosition } from '@/actions/chat';
import type { ChatMessageItem, ChatRoomDetailResponse } from '@/connectors/api/pecus';
import { useSignalREvent } from '@/hooks/useSignalR';
import { useSignalRContext } from '@/providers/SignalRProvider';
import ChatMessageInput from './ChatMessageInput';
import ChatMessageList from './ChatMessageList';
import ChatTypingIndicator from './ChatTypingIndicator';

interface ChatMessageAreaProps {
  roomId: number;
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

/** SignalR chat:user_typing イベントのペイロード型 */
interface ChatUserTypingPayload {
  roomId: number;
  userId: number;
  userName: string;
  isTyping: boolean;
}

/** SignalR chat:message_read イベントのペイロード型 */
interface ChatMessageReadPayload {
  roomId: number;
  userId: number;
  readAt: string;
  readMessageId?: number | null;
}

/** 入力中ユーザー情報 */
interface TypingUser {
  userId: number;
  userName: string;
  timeoutId: NodeJS.Timeout;
}

/**
 * メッセージエリアコンポーネント
 * - ルーム詳細とメッセージを取得
 * - メッセージ送信
 * - 既読位置の更新
 * - 入力中インジケーター表示
 */
export default function ChatMessageArea({ roomId, currentUserId }: ChatMessageAreaProps) {
  const { joinChat, leaveChat, sendChatTyping } = useSignalRContext();
  const [room, setRoom] = useState<ChatRoomDetailResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  // 入力中ユーザー管理
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingUsersRef = useRef<Map<number, TypingUser>>(new Map());

  // 既読状態管理（DM用）: 相手が読んだ最新のメッセージID
  const [lastReadMessageId, setLastReadMessageId] = useState<number | null>(null);

  // チャットルームグループに参加/離脱
  useEffect(() => {
    joinChat(roomId);
    return () => {
      leaveChat(roomId);
      // クリーンアップ: 入力中のタイムアウトをクリア
      for (const user of typingUsersRef.current.values()) {
        clearTimeout(user.timeoutId);
      }
      typingUsersRef.current.clear();
    };
  }, [roomId, joinChat, leaveChat]);

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

        // 最新メッセージIDで既読位置を更新
        const latestMessage = messagesResult.data.messages[messagesResult.data.messages.length - 1];
        if (latestMessage) {
          await updateReadPosition(roomId, undefined, latestMessage.id);
        } else {
          await updateReadPosition(roomId);
        }
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
      // 入力終了を通知
      sendChatTyping(roomId, false);
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
    [roomId, sendChatTyping],
  );

  // 入力中通知
  const handleTyping = useCallback(() => {
    sendChatTyping(roomId, true);
  }, [roomId, sendChatTyping]);

  // roomId が変わったらデータを再取得
  useEffect(() => {
    // 入力中状態をリセット
    setTypingUsers([]);
    for (const user of typingUsersRef.current.values()) {
      clearTimeout(user.timeoutId);
    }
    typingUsersRef.current.clear();
    setLastReadMessageId(null);

    fetchRoomAndMessages();
  }, [fetchRoomAndMessages]);

  // SignalR: 現在開いているルームのメッセージをリアルタイム受信
  const handleMessageReceived = useCallback(
    (payload: ChatMessageReceivedPayload) => {
      // 現在開いているルームのメッセージのみ処理
      if (payload.roomId !== roomId) {
        return;
      }
      // 自分が送信したメッセージは既にローカルで追加済みなのでスキップ
      if (payload.message.senderUserId === currentUserId) {
        return;
      }
      // 新しいメッセージを追加
      const newMessage: ChatMessageItem = {
        id: payload.message.id,
        senderUserId: payload.message.senderUserId,
        sender: payload.message.sender,
        messageType: payload.message.messageType as ChatMessageItem['messageType'],
        content: payload.message.content,
        replyToMessageId: payload.message.replyToMessageId,
        createdAt: payload.message.createdAt,
      };
      setMessages((prev) => [...prev, newMessage]);
      // 既読位置を更新（新しいメッセージIDを含む）
      updateReadPosition(roomId, undefined, payload.message.id);

      // メッセージを受信したら、その送信者の入力中表示を消す
      const existingUser = typingUsersRef.current.get(payload.message.senderUserId);
      if (existingUser) {
        clearTimeout(existingUser.timeoutId);
        typingUsersRef.current.delete(payload.message.senderUserId);
        setTypingUsers(Array.from(typingUsersRef.current.values()));
      }
    },
    [roomId, currentUserId],
  );

  useSignalREvent<ChatMessageReceivedPayload>('chat:message_received', handleMessageReceived);

  // SignalR: 入力中通知
  const handleUserTyping = useCallback(
    (payload: ChatUserTypingPayload) => {
      // 現在開いているルームのみ処理
      if (payload.roomId !== roomId) {
        return;
      }
      // 自分自身は無視
      if (payload.userId === currentUserId) {
        return;
      }

      const existingUser = typingUsersRef.current.get(payload.userId);

      if (payload.isTyping) {
        // 入力開始
        if (existingUser) {
          // 既存のタイムアウトをクリアして延長
          clearTimeout(existingUser.timeoutId);
        }

        // 5秒後に自動的に入力終了とみなす
        const timeoutId = setTimeout(() => {
          typingUsersRef.current.delete(payload.userId);
          setTypingUsers(Array.from(typingUsersRef.current.values()));
        }, 5000);

        typingUsersRef.current.set(payload.userId, {
          userId: payload.userId,
          userName: payload.userName,
          timeoutId,
        });
      } else {
        // 入力終了
        if (existingUser) {
          clearTimeout(existingUser.timeoutId);
          typingUsersRef.current.delete(payload.userId);
        }
      }

      setTypingUsers(Array.from(typingUsersRef.current.values()));
    },
    [roomId, currentUserId],
  );

  useSignalREvent<ChatUserTypingPayload>('chat:user_typing', handleUserTyping);

  // SignalR: 既読通知（DM用）
  const handleMessageRead = useCallback(
    (payload: ChatMessageReadPayload) => {
      // 現在開いているルームのみ処理
      if (payload.roomId !== roomId) {
        return;
      }
      // 自分自身の既読は無視
      if (payload.userId === currentUserId) {
        return;
      }
      // DMの場合のみ既読表示を更新
      if (room?.type === 'Dm' && payload.readMessageId) {
        setLastReadMessageId((prev) => {
          // より新しいメッセージIDの場合のみ更新
          if (prev === null || payload.readMessageId! > prev) {
            return payload.readMessageId!;
          }
          return prev;
        });
      }
    },
    [roomId, currentUserId, room?.type],
  );

  useSignalREvent<ChatMessageReadPayload>('chat:message_read', handleMessageRead);

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
        lastReadMessageId={lastReadMessageId}
        isDm={room?.type === 'Dm'}
      />

      {/* 入力中インジケーター */}
      <ChatTypingIndicator typingUsers={typingUsers} />

      {/* 入力欄 */}
      <ChatMessageInput onSend={handleSend} onTyping={handleTyping} disabled={sending} />
    </div>
  );
}
