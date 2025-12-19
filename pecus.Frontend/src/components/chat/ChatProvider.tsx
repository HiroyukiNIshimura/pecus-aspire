'use client';

import { useCallback, useEffect, useState } from 'react';
import { getChatRooms, getChatUnreadCounts } from '@/actions/chat';
import type { ChatRoomItem } from '@/connectors/api/pecus';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useChatStore } from '@/stores/chatStore';
import ChatBottomDrawer from './ChatBottomDrawer';

/**
 * チャット用プロバイダー
 * - ルーム一覧と未読数を取得
 * - PC用のボトムドロワーを表示
 * - スマホは /chat へ遷移するのでドロワーは表示しない
 */
export default function ChatProvider() {
  const isMobile = useIsMobile();
  const { isDrawerOpen, setUnreadCounts } = useChatStore();
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(false);

  // ルーム一覧を取得
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getChatRooms();
      if (result.success && result.data) {
        setRooms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 未読数を取得
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const result = await getChatUnreadCounts();
      if (result.success && result.data) {
        setUnreadCounts({
          total: result.data.totalUnreadCount,
          dm: result.data.dmUnreadCount,
          group: result.data.groupUnreadCount,
          ai: result.data.aiUnreadCount,
          system: result.data.systemUnreadCount,
        });
      }
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  }, [setUnreadCounts]);

  // 初回マウント時に未読数を取得
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // ドロワーが開いた時にルーム一覧を取得
  useEffect(() => {
    if (isDrawerOpen && !isMobile) {
      fetchRooms();
    }
  }, [isDrawerOpen, isMobile, fetchRooms]);

  // スマホの場合はドロワーを表示しない
  if (isMobile) {
    return null;
  }

  return <ChatBottomDrawer rooms={rooms} loading={loading} />;
}
