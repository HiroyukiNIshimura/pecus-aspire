'use client';

import { useCallback, useRef } from 'react';
import { getChatRoomDetail } from '@/actions/chat';
import { useNotify } from '@/hooks/useNotify';
import { useSignalREvent } from '@/hooks/useSignalR';
import { useCurrentUserId } from '@/providers/AppSettingsProvider';
import { useChatStore } from '@/stores/chatStore';

interface ChatUserMentionedPayload {
  roomId?: number;
  messageId?: number;
  mentionedUserId?: number;
  senderActorId?: number | null;
  senderDisplayName?: string | null;
  preview?: string | null;
  createdAt?: string;
  RoomId?: number;
  MessageId?: number;
  MentionedUserId?: number;
  SenderActorId?: number | null;
  SenderDisplayName?: string | null;
  Preview?: string | null;
  CreatedAt?: string;
}

/**
 * 自分宛メンションをグローバルに Notyf 通知するコンポーネント
 * - チャット画面外でも通知表示
 * - チャットアイコンのバッジ反映用に mentionUnreadCount を加算
 */
export function ChatMentionNotification() {
  const currentUserId = useCurrentUserId();
  const notify = useNotify();
  const incrementMentionUnread = useChatStore((state) => state.incrementMentionUnread);
  const roomNameCacheRef = useRef<Map<number, string>>(new Map());

  const resolveRoomName = useCallback(
    async (roomId: number): Promise<string> => {
      const cached = roomNameCacheRef.current.get(roomId);
      if (cached) {
        return cached;
      }

      const fallbackName = `ルーム #${roomId}`;

      try {
        const result = await getChatRoomDetail({ roomId });
        if (!result.success || !result.data) {
          return fallbackName;
        }

        const room = result.data;
        let resolvedName = room.name?.trim();

        if (!resolvedName) {
          if (room.type === 'Dm') {
            const otherMember = room.members.find((member) => member.id !== currentUserId);
            resolvedName = otherMember?.username || fallbackName;
          } else if (room.type === 'Ai') {
            resolvedName = 'AIルーム';
          } else if (room.type === 'System') {
            resolvedName = 'システムルーム';
          }
        }

        const finalName = resolvedName || fallbackName;
        roomNameCacheRef.current.set(roomId, finalName);
        return finalName;
      } catch {
        return fallbackName;
      }
    },
    [currentUserId],
  );

  useSignalREvent<ChatUserMentionedPayload>('chat:user_mentioned', (payload) => {
    const mentionedUserId = Number(payload.mentionedUserId ?? payload.MentionedUserId ?? -1);
    if (!Number.isFinite(mentionedUserId) || mentionedUserId !== currentUserId) {
      return;
    }

    const roomId = Number(payload.roomId ?? payload.RoomId ?? -1);
    const senderName = payload.senderDisplayName ?? payload.SenderDisplayName ?? '誰か';

    void (async () => {
      const roomName = Number.isFinite(roomId) && roomId > 0 ? await resolveRoomName(roomId) : '不明なルーム';
      const message = `${senderName} さんが「${roomName}」であなたをメンションしました`;

      incrementMentionUnread();
      notify.info(message, 8000);
    })();
  });

  return null;
}
