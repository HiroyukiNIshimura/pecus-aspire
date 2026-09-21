'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatRoomItem } from '@/connectors/api/pecus';
import { useChatStore } from '@/stores/chatStore';
import ChatMessageArea from './ChatMessageArea';
import ChatRoomList from './ChatRoomList';

interface ChatBottomDrawerProps {
  rooms: ChatRoomItem[];
  currentUserId: number;
  loading?: boolean;
  onRoomCreated?: () => void;
}

const DEFAULT_DRAWER_HEIGHT = '50vh';
const MIN_DRAWER_HEIGHT = 300;
const MAX_DRAWER_HEIGHT = 700;

/**
 * PC用ボトムドロワー
 * 画面下部からスライドして出現し、作業コンテキストを維持しながらチャット可能
 */
export default function ChatBottomDrawer({
  rooms,
  currentUserId,
  loading = false,
  onRoomCreated,
}: ChatBottomDrawerProps) {
  const { isDrawerOpen, closeDrawer, selectedRoomId } = useChatStore();
  const [drawerHeight, setDrawerHeight] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(null);

  // Escape キーでドロワーを閉じる（IME 変換中は無視）
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // IME 変換中（日本語変換中など）は Escape を無視
      // 変換キャンセルの意図であり、ドロワーを閉じる意図ではない
      if (e.isComposing) return;

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

  // PC用ドロワーの上端をドラッグして高さを変更する
  const handleResizePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drawer = event.currentTarget.parentElement;
    if (!drawer) return;

    resizeStateRef.current = {
      startY: event.clientY,
      startHeight: drawer.getBoundingClientRect().height,
    };
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, []);

  const handleResizePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) return;

    const nextHeight = Math.min(
      MAX_DRAWER_HEIGHT,
      Math.max(MIN_DRAWER_HEIGHT, resizeState.startHeight + resizeState.startY - event.clientY),
    );
    setDrawerHeight(nextHeight);
  }, []);

  const handleResizePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    resizeStateRef.current = null;
    setIsResizing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const handleResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

      const currentHeight = drawerHeight ?? window.innerHeight * 0.5;
      const delta = event.key === 'ArrowUp' ? 20 : -20;
      const nextHeight = Math.min(MAX_DRAWER_HEIGHT, Math.max(MIN_DRAWER_HEIGHT, currentHeight + delta));
      setDrawerHeight(nextHeight);
      event.preventDefault();
    },
    [drawerHeight],
  );

  // ドロワーが閉じている場合は何も表示しない
  if (!isDrawerOpen) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-base-100 border-t-2 border-base-content/20 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out"
      style={{
        height: drawerHeight ? `${drawerHeight}px` : DEFAULT_DRAWER_HEIGHT,
        minHeight: MIN_DRAWER_HEIGHT,
        maxHeight: MAX_DRAWER_HEIGHT,
      }}
    >
      {/* PC用リサイズハンドル */}
      <div
        role="separator"
        aria-label="チャット領域の高さを変更"
        aria-orientation="horizontal"
        aria-valuemin={MIN_DRAWER_HEIGHT}
        aria-valuemax={MAX_DRAWER_HEIGHT}
        aria-valuenow={drawerHeight ?? undefined}
        tabIndex={0}
        className={`absolute inset-x-0 top-0 z-10 hidden h-1 cursor-row-resize hover:bg-primary/50 transition-colors md:block ${
          isResizing ? 'bg-primary' : ''
        }`}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerUp}
        onKeyDown={handleResizeKeyDown}
      />

      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-base-content/10 bg-base-200">
        <h2 className="font-semibold text-base">チャット</h2>
        <button type="button" onClick={closeDrawer} className="btn btn-secondary btn-sm btn-circle" aria-label="閉じる">
          <span className="icon-[tabler--x] size-5" aria-hidden="true" />
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="flex h-[calc(100%-48px)]">
        {/* 左: ルーム一覧 */}
        <div className="w-80 border-r border-base-content/10 flex-shrink-0">
          <ChatRoomList rooms={rooms} loading={loading} onRoomCreated={onRoomCreated} />
        </div>

        {/* 右: メッセージエリア */}
        <div className="flex-1 flex flex-col">
          {selectedRoomId ? (
            <ChatMessageArea roomId={selectedRoomId} currentUserId={currentUserId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-base-content/50 bg-base-200/60">
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
