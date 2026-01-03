'use client';

import { useEffect, useRef } from 'react';
import { EmptyState } from '@/components/common/feedback/EmptyState';
import type { ChatMessageItem } from '@/connectors/api/pecus';
import ChatMessageItemComponent from './ChatMessageItem';

interface ChatMessageListProps {
  messages: ChatMessageItem[];
  currentUserId: number;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** 相手が既読した最新のメッセージID（DM/AI チャット用） */
  lastReadMessageId?: number | null;
  /** 既読表示を有効にするか（DM/AI チャット用） */
  showReadStatus?: boolean;
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
  lastReadMessageId,
  showReadStatus = false,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // 新着メッセージ時に自動スクロール
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      // メッセージが増えた場合、最下部にスクロール
      // scrollIntoView は親要素にも影響を与える可能性があるため、scrollTop を使用
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // 初回表示時に最下部にスクロール
  useEffect(() => {
    // scrollIntoView は親要素にも影響を与える可能性があるため、scrollTop を使用
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  // スクロール位置監視（上端に達したら過去メッセージを読み込み）
  const handleScroll = () => {
    if (!containerRef.current || loading || !hasMore || !onLoadMore) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      onLoadMore();
    }
  };

  // 自分のメッセージのうち、相手が既読した最新のものを特定
  const getShowReadStatus = (message: ChatMessageItem): boolean => {
    if (!showReadStatus || !lastReadMessageId) return false;
    // 自分のメッセージのみ既読表示
    if (message.senderUserId !== currentUserId) return false;
    // 既読されたメッセージID以下のメッセージは既読済み
    // ただし、最新の既読メッセージのみに「既読」を表示
    return message.id === lastReadMessageId;
  };

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          iconClass="icon-[tabler--message-circle]"
          message="メッセージを入力して会話を始めましょう"
          size="sm"
        />
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
          showReadStatus={getShowReadStatus(message)}
        />
      ))}

      {/* 最下部マーカー（自動スクロール用） */}
      <div ref={bottomRef} />
    </div>
  );
}
