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
    senderActorId: number;
    messageType: string;
    content: string;
    replyToMessageId?: number;
    createdAt: string;
    sender?: {
      id: number;
      actorType: string;
      userId?: number | null;
      botId?: number | null;
      displayName: string;
      avatarType?: string;
      avatarUrl?: string;
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

/** SignalR chat:bot_message_read イベントのペイロード型 */
interface ChatBotMessageReadPayload {
  roomId: number;
  botActorId: number;
  readAt: string;
  readMessageId?: number | null;
}

/** SignalR chat:bot_typing イベントのペイロード型 */
interface ChatBotTypingPayload {
  roomId: number;
  botActorId: number;
  botName: string;
  isTyping: boolean;
}

/** SignalR chat:bot_error イベントのペイロード型 */
interface ChatBotErrorPayload {
  roomId: number;
  botActorId: number;
  botName: string;
  errorMessage: string;
}

/** 入力中ユーザー情報 */
interface TypingUser {
  userId: number;
  userName: string;
  timeoutId: NodeJS.Timeout;
}

/** Bot の入力中情報 */
interface BotTypingState {
  botActorId: number;
  botName: string;
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

  // Bot 入力中状態管理
  const [botTyping, setBotTyping] = useState<{ botName: string } | null>(null);
  const botTypingRef = useRef<BotTypingState | null>(null);

  // Bot エラー状態管理
  const [botError, setBotError] = useState<string | null>(null);

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
      // Bot 入力中タイムアウトもクリア
      if (botTypingRef.current) {
        clearTimeout(botTypingRef.current.timeoutId);
        botTypingRef.current = null;
      }
    };
  }, [roomId, joinChat, leaveChat]);

  // ルーム詳細とメッセージを取得
  const fetchRoomAndMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [roomResult, messagesResult] = await Promise.all([getChatRoomDetail(roomId), getChatMessages(roomId)]);

      if (roomResult.success && roomResult.data) {
        setRoom(roomResult.data);

        // DM/AI ルームの場合、相手（Bot）の既読位置を初期化
        if (
          (roomResult.data.type === 'Dm' || roomResult.data.type === 'Ai') &&
          messagesResult.success &&
          messagesResult.data
        ) {
          // DM: 自分以外のメンバー、AI: Bot メンバー（id が 0 のメンバー）
          const otherMember =
            roomResult.data.type === 'Dm'
              ? roomResult.data.members?.find((m) => m.id !== currentUserId)
              : roomResult.data.members?.find((m) => m.id === 0); // Bot は id が 0

          if (otherMember?.lastReadAt) {
            // 相手の lastReadAt 以前に自分が送信したメッセージの中で最新のものを探す
            const otherLastReadAt = new Date(otherMember.lastReadAt);
            const myMessages = messagesResult.data.messages.filter(
              (m) => m.senderUserId === currentUserId && m.createdAt && new Date(m.createdAt) <= otherLastReadAt,
            );
            if (myMessages.length > 0) {
              // 最新の既読メッセージID
              const lastReadMsg = myMessages[myMessages.length - 1];
              setLastReadMessageId(lastReadMsg.id);
            }
          }
        }
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
  }, [roomId, currentUserId]);

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
          // senderUserId が null/undefined の場合は currentUserId を使用
          // API レスポンスのシリアライズ時に null になる場合があるため
          const messageWithSender = {
            ...result.data,
            senderUserId: result.data.senderUserId ?? currentUserId,
          };
          // 送信したメッセージを一覧に追加
          setMessages((prev) => [...prev, messageWithSender]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setSending(false);
      }
    },
    [roomId, sendChatTyping, currentUserId],
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
    // Bot 入力中状態をリセット
    if (botTypingRef.current) {
      clearTimeout(botTypingRef.current.timeoutId);
      botTypingRef.current = null;
    }
    setBotTyping(null);
    setBotError(null);

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
      // バックエンドは sender.userId を送信するので、それと比較
      if (payload.message.sender?.userId === currentUserId) {
        return;
      }
      // 新しいメッセージを追加
      const newMessage: ChatMessageItem = {
        id: payload.message.id,
        senderUserId: payload.message.sender?.userId,
        sender: payload.message.sender
          ? {
              id: payload.message.sender.id,
              username: payload.message.sender.displayName ?? null,
              identityIconUrl: payload.message.sender.identityIconUrl ?? null,
              isActive: payload.message.sender.isActive ?? true,
            }
          : undefined,
        messageType: payload.message.messageType as ChatMessageItem['messageType'],
        content: payload.message.content,
        replyToMessageId: payload.message.replyToMessageId,
        createdAt: payload.message.createdAt,
      };
      setMessages((prev) => [...prev, newMessage]);
      // 既読位置を更新（新しいメッセージIDを含む）
      updateReadPosition(roomId, undefined, payload.message.id);

      // メッセージを受信したら、その送信者の入力中表示を消す
      if (payload.message.sender?.userId) {
        const existingUser = typingUsersRef.current.get(payload.message.sender.userId);
        if (existingUser) {
          clearTimeout(existingUser.timeoutId);
          typingUsersRef.current.delete(payload.message.sender.userId);
          setTypingUsers(Array.from(typingUsersRef.current.values()));
        }
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

  // SignalR: Bot 既読通知（AI チャット用）
  const handleBotMessageRead = useCallback(
    (payload: ChatBotMessageReadPayload) => {
      // 現在開いているルームのみ処理
      if (payload.roomId !== roomId) {
        return;
      }
      // AI ルームの場合のみ既読表示を更新
      if (room?.type === 'Ai' && payload.readMessageId) {
        setLastReadMessageId((prev) => {
          // より新しいメッセージIDの場合のみ更新
          if (prev === null || payload.readMessageId! > prev) {
            return payload.readMessageId!;
          }
          return prev;
        });
      }
    },
    [roomId, room?.type],
  );

  useSignalREvent<ChatBotMessageReadPayload>('chat:bot_message_read', handleBotMessageRead);

  // SignalR: Bot 入力中通知
  const handleBotTyping = useCallback(
    (payload: ChatBotTypingPayload) => {
      // 現在開いているルームのみ処理
      if (payload.roomId !== roomId) {
        return;
      }

      // エラー状態をクリア（新しい入力が始まった場合）
      if (payload.isTyping) {
        setBotError(null);
      }

      if (payload.isTyping) {
        // 入力開始
        if (botTypingRef.current) {
          // 既存のタイムアウトをクリア
          clearTimeout(botTypingRef.current.timeoutId);
        }

        // 60秒後に自動的に入力終了とみなす（タイムアウト対策）
        const timeoutId = setTimeout(() => {
          botTypingRef.current = null;
          setBotTyping(null);
        }, 60000);

        botTypingRef.current = {
          botActorId: payload.botActorId,
          botName: payload.botName,
          timeoutId,
        };
        setBotTyping({ botName: payload.botName });
      } else {
        // 入力終了
        if (botTypingRef.current) {
          clearTimeout(botTypingRef.current.timeoutId);
          botTypingRef.current = null;
        }
        setBotTyping(null);
      }
    },
    [roomId],
  );

  useSignalREvent<ChatBotTypingPayload>('chat:bot_typing', handleBotTyping);

  // SignalR: Bot エラー通知
  const handleBotError = useCallback(
    (payload: ChatBotErrorPayload) => {
      // 現在開いているルームのみ処理
      if (payload.roomId !== roomId) {
        return;
      }

      // 入力中状態をクリア
      if (botTypingRef.current) {
        clearTimeout(botTypingRef.current.timeoutId);
        botTypingRef.current = null;
      }
      setBotTyping(null);

      // エラーメッセージを設定（数秒後に自動クリア）
      setBotError(payload.errorMessage);
      setTimeout(() => {
        setBotError(null);
      }, 5000);
    },
    [roomId],
  );

  useSignalREvent<ChatBotErrorPayload>('chat:bot_error', handleBotError);

  // ルーム名を取得
  const getRoomName = () => {
    if (!room) return 'ルーム';
    if (room.type === 'Dm') {
      // DM の場合は自分以外のメンバーを取得
      const otherMember = room.members.find((m) => m.id !== currentUserId);
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
        showReadStatus={room?.type === 'Dm' || room?.type === 'Ai'}
      />

      {/* 入力中インジケーター */}
      <ChatTypingIndicator typingUsers={typingUsers} botTyping={botTyping} />

      {/* Bot エラー表示 */}
      {botError && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-error bg-error/10">
          <span className="icon-[tabler--alert-circle] size-4" />
          <span>{botError}</span>
        </div>
      )}

      {/* 入力欄 */}
      <ChatMessageInput onSend={handleSend} onTyping={handleTyping} disabled={sending} />
    </div>
  );
}
