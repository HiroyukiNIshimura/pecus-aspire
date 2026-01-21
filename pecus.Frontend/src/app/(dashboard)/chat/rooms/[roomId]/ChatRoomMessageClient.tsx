'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getChatMessages, sendChatMessage, updateReadPosition } from '@/actions/chat';
import ChatMessageInput from '@/components/chat/ChatMessageInput';
import ChatMessageList from '@/components/chat/ChatMessageList';
import type { ChatMessageItem, ChatRoomDetailResponse } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSignalREvent } from '@/hooks/useSignalR';
import { useSignalRContext } from '@/providers/SignalRProvider';

interface ChatRoomMessageClientProps {
  room: ChatRoomDetailResponse;
  initialMessages: ChatMessageItem[];
  hasMore: boolean;
  nextCursor: number | null;
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
 * スマホ用チャットメッセージ画面
 */
export default function ChatRoomMessageClient({
  room,
  initialMessages,
  hasMore: initialHasMore,
  nextCursor: initialNextCursor,
  currentUserId,
}: ChatRoomMessageClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { joinChat, leaveChat } = useSignalRContext();
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // PC表示時はダッシュボードへリダイレクト（ドロワーを使うため）
  // isMobile === null は初期化中なのでスキップ
  useEffect(() => {
    if (isMobile === false) {
      router.replace('/');
    }
  }, [isMobile, router]);

  // チャットルームグループに参加/離脱
  useEffect(() => {
    joinChat(room.id);
    return () => {
      leaveChat(room.id);
    };
  }, [room.id, joinChat, leaveChat]);

  // 初期表示時に既読位置を更新
  useEffect(() => {
    const updateRead = async () => {
      // 最新メッセージIDで既読位置を更新
      const latestMessage = messages[messages.length - 1];
      if (latestMessage) {
        console.log('[ChatRoomMessageClient] Updating read position with messageId:', latestMessage.id);
        const result = await updateReadPosition(room.id, undefined, latestMessage.id);
        console.log('[ChatRoomMessageClient] updateReadPosition result:', result);
      } else {
        // メッセージがない場合も既読位置を更新（タイムスタンプのみ）
        console.log('[ChatRoomMessageClient] Updating read position without messageId');
        await updateReadPosition(room.id);
      }
    };
    updateRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]); // 初回マウント時のみ実行

  // ルーム名を取得
  const getRoomName = () => {
    if (room.type === 'Dm') {
      // DM の場合は自分以外のメンバーを取得
      const otherMember = room.members.find((m) => m.id !== currentUserId);
      return otherMember?.username || 'ルーム';
    }
    return room.name || 'ルーム';
  };

  // 過去のメッセージを読み込み
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const result = await getChatMessages(room.id, 50, nextCursor);
      if (result.success && result.data) {
        setMessages((prev) => [...result.data!.messages, ...prev]);
        setHasMore(result.data.hasMore ?? false);
        setNextCursor(result.data.nextCursor ?? null);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [room.id, hasMore, nextCursor, loadingMore]);

  // メッセージ送信
  const handleSend = useCallback(
    async (content: string) => {
      setSending(true);
      try {
        const result = await sendChatMessage(room.id, content);
        if (result.success && result.data) {
          // senderUserId が null/undefined の場合は currentUserId を使用
          // API レスポンスのシリアライズ時に null になる場合があるため
          const messageWithSender = {
            ...result.data,
            senderUserId: result.data.senderUserId ?? currentUserId,
          };
          setMessages((prev) => [...prev, messageWithSender]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setSending(false);
      }
    },
    [room.id, currentUserId],
  );

  // SignalR: 現在開いているルームのメッセージをリアルタイム受信
  const handleMessageReceived = useCallback(
    (payload: ChatMessageReceivedPayload) => {
      // 現在開いているルームのメッセージのみ処理
      if (payload.roomId !== room.id) {
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
        sender: payload.message.sender
          ? {
              id: payload.message.sender.id,
              username: payload.message.sender.username ?? null,
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
      // 既読位置を更新
      updateReadPosition(room.id);
    },
    [room.id, currentUserId],
  );

  useSignalREvent<ChatMessageReceivedPayload>('chat:message_received', handleMessageReceived);

  return (
    <div className="fixed inset-0 flex flex-col bg-base-100">
      {/* ヘッダー */}
      <div className="flex items-center px-4 py-3 border-b border-base-300 bg-base-200 shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-secondary btn-sm btn-circle mr-2"
          aria-label="戻る"
        >
          <span className="icon-[tabler--arrow-left] size-5" aria-hidden="true" />
        </button>
        <h1 className="font-semibold text-lg truncate">{getRoomName()}</h1>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ChatMessageList
          messages={messages}
          currentUserId={currentUserId}
          loading={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMoreMessages}
        />
      </div>

      {/* 入力欄 */}
      <ChatMessageInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
