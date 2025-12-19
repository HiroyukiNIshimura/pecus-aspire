'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessageItem } from '@/connectors/api/pecus';
import ChatMessageItemComponent from './ChatMessageItem';

interface ChatMessageListProps {
  messages: ChatMessageItem[];
  currentUserId: number;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

/**
 * メッセージ一覧コンポーネント
 * - 新しいメッセージが下に表示
 * - 自動スクロール（新着メッセージ時）
 * - 無限スクロール（上方向に過去メッセージを読み込み）
 */
export default function ChatMessageList({
  messages,
  currentUserId,
  loading = false,
  hasMore = false,
  onLoadMore,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // 新着メッセージ時に自動スクロール
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // メッセージが増えた場合、最下部にスクロール
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // 初回表示時に最下部にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  // スクロール位置監視（上端に達したら過去メッセージを読み込み）
  const handleScroll = () => {
    if (!containerRef.current || loading || !hasMore || !onLoadMore) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      onLoadMore();
    }
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-base-content/50">
        <div className="text-center">
          <span className="icon-[tabler--message] size-12 mb-2" aria-hidden="true" />
          <p>メッセージはありません</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-2" onScroll={handleScroll}>
      {/* ローディング（過去メッセージ読み込み中） */}
      {loading && hasMore && (
        <div className="flex justify-center py-2">
          <span className="loading loading-spinner loading-sm" />
        </div>
      )}

      {/* メッセージ一覧 */}
      {messages.map((message) => (
        <ChatMessageItemComponent
          key={message.id}
          message={message}
          isOwnMessage={message.senderUserId === currentUserId}
        />
      ))}

      {/* 最下部マーカー（自動スクロール用） */}
      <div ref={bottomRef} />
    </div>
  );
}
