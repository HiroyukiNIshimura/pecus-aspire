'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getChatMessages, sendChatMessage } from '@/actions/chat';
import ChatMessageInput from '@/components/chat/ChatMessageInput';
import ChatMessageList from '@/components/chat/ChatMessageList';
import type { ChatMessageItem, ChatRoomDetailResponse } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ChatRoomMessageClientProps {
  room: ChatRoomDetailResponse;
  initialMessages: ChatMessageItem[];
  hasMore: boolean;
  nextCursor: number | null;
  currentUserId: number;
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

  // ルーム名を取得
  const getRoomName = () => {
    if (room.type === 'Dm') {
      // DM の場合は自分以外のメンバーを取得
      const otherMember = room.members.find((m) => m.userId !== currentUserId);
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
          setMessages((prev) => [...prev, result.data!]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setSending(false);
      }
    },
    [room.id],
  );

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
        <h1 className="font-semibold text-lg truncate">{getRoomName()}</h1>
      </div>

      {/* メッセージ一覧 */}
      <ChatMessageList
        messages={messages}
        currentUserId={currentUserId}
        loading={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMoreMessages}
      />

      {/* 入力欄 */}
      <ChatMessageInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
