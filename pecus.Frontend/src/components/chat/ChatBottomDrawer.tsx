'use client';

import { useCallback, useEffect } from 'react';
import type { ChatRoomItem } from '@/connectors/api/pecus';
import { useChatStore } from '@/stores/chatStore';
import ChatMessageArea from './ChatMessageArea';
import ChatRoomList from './ChatRoomList';

interface ChatBottomDrawerProps {
  rooms: ChatRoomItem[];
  currentUserId: number;
  loading?: boolean;
}

/**
 * PC用ボトムドロワー
 * 画面下部からスライドして出現し、作業コンテキストを維持しながらチャット可能
 */
export default function ChatBottomDrawer({ rooms, currentUserId, loading = false }: ChatBottomDrawerProps) {
  const { isDrawerOpen, closeDrawer, selectedRoomId } = useChatStore();

  // Escape キーでドロワーを閉じる
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    },
    [isDrawerOpen, closeDrawer],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ドロワーが閉じている場合は何も表示しない
  if (!isDrawerOpen) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-base-100 border-t border-base-300 shadow-lg transition-transform duration-300 ease-out"
      style={{ height: '50vh', minHeight: '300px', maxHeight: '600px' }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-base-300 bg-base-200">
        <h2 className="font-semibold text-base">チャット</h2>
        <button type="button" onClick={closeDrawer} className="btn btn-ghost btn-sm btn-circle" aria-label="閉じる">
          <span className="icon-[tabler--x] size-5" aria-hidden="true" />
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="flex h-[calc(100%-48px)]">
        {/* 左: ルーム一覧 */}
        <div className="w-80 border-r border-base-300 flex-shrink-0">
          <ChatRoomList rooms={rooms} loading={loading} />
        </div>

        {/* 右: メッセージエリア */}
        <div className="flex-1 flex flex-col">
          {selectedRoomId ? (
            <ChatMessageArea roomId={selectedRoomId} currentUserId={currentUserId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-base-content/50">
              <div className="text-center">
                <span className="icon-[tabler--message-circle] size-12 mb-2" aria-hidden="true" />
                <p>ルームを選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
