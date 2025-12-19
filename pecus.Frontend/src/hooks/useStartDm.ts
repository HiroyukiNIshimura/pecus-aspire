'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { createOrGetDmRoom } from '@/actions/chat';
import { useChatStore } from '@/stores/chatStore';

interface UseStartDmOptions {
  /** DM開始後にチャット画面に遷移するか（デフォルト: true） */
  navigateToChat?: boolean;
}

interface UseStartDmReturn {
  /** DM開始処理 */
  startDm: (targetUserId: number) => Promise<number | null>;
  /** 処理中かどうか */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

/**
 * DM開始用カスタムフック
 *
 * アバタークリックなどからDMを開始する際に使用。
 * - DM ルームを作成（または既存を取得）
 * - PC: ボトムドロワーを開いてルームを選択
 * - スマホ: /chat/rooms/{roomId} に遷移
 */
export function useStartDm(options: UseStartDmOptions = {}): UseStartDmReturn {
  const { navigateToChat = true } = options;
  const router = useRouter();
  const { openDrawer, selectRoom } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDm = useCallback(
    async (targetUserId: number): Promise<number | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await createOrGetDmRoom(targetUserId);

        if (!result.success) {
          setError(result.message || 'DMルームの作成に失敗しました');
          return null;
        }

        const roomId = result.data.id;

        if (navigateToChat) {
          // 画面幅でPC/スマホを判定
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

          if (isMobile) {
            // スマホ: チャットルームページに遷移
            router.push(`/chat/rooms/${roomId}`);
          } else {
            // PC: ボトムドロワーを開いてルームを選択
            selectRoom(roomId);
            openDrawer();
          }
        }

        return roomId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'DMルームの作成に失敗しました';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [navigateToChat, router, openDrawer, selectRoom],
  );

  return { startDm, isLoading, error };
}
