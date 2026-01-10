'use client';

import { useEffect, useRef, useState } from 'react';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import {
  type OrganizationPresenceUser,
  type SignalRNotification,
  useSignalRContext,
} from '@/providers/SignalRProvider';

/**
 * プレゼンスユーザー情報（内部状態用）
 */
interface PresenceUserState {
  userId: number;
  userName: string;
  identityIconUrl?: string | null;
  /** アニメーション状態 */
  animState: 'entering' | 'idle' | 'leaving';
}

interface OrganizationPresenceProps {
  organizationId: number;
  currentUserId: number;
  /** 初期ユーザー一覧 */
  initialUsers?: OrganizationPresenceUser[];
  maxVisible?: number;
}

/**
 * 組織にリアルタイムで参加中のユーザーを表示するコンポーネント
 * コンパクトなアバター一覧形式で表示
 */
export default function OrganizationPresence({
  organizationId,
  currentUserId,
  initialUsers = [],
  maxVisible = 8,
}: OrganizationPresenceProps) {
  const { onNotification, connectionState } = useSignalRContext();
  const [presenceUsers, setPresenceUsers] = useState<PresenceUserState[]>([]);
  const lastInitialUsersLengthRef = useRef(-1);

  const organizationIdRef = useRef(organizationId);
  const currentUserIdRef = useRef(currentUserId);
  organizationIdRef.current = organizationId;
  currentUserIdRef.current = currentUserId;

  // 初期ユーザー一覧を設定
  useEffect(() => {
    if (initialUsers.length === 0) return;
    if (lastInitialUsersLengthRef.current === initialUsers.length) return;
    lastInitialUsersLengthRef.current = initialUsers.length;

    const otherUsers = initialUsers.filter((u) => u.userId !== currentUserId);
    if (otherUsers.length > 0) {
      setPresenceUsers((prev) => {
        const existingIds = new Set(prev.map((p) => p.userId));
        const newUsers = otherUsers.filter((u) => !existingIds.has(u.userId));
        if (newUsers.length === 0) return prev;
        return [
          ...prev,
          ...newUsers.map((u) => ({
            userId: u.userId,
            userName: u.userName,
            identityIconUrl: u.identityIconUrl,
            animState: 'idle' as const,
          })),
        ];
      });
    }
  }, [initialUsers, currentUserId]);

  useEffect(() => {
    const handler = (notification: SignalRNotification) => {
      if (
        notification.eventType !== 'organization:user_joined' &&
        notification.eventType !== 'organization:user_left'
      ) {
        return;
      }

      const payload = notification.payload as {
        organizationId?: number;
        userId?: number;
        userName?: string;
        identityIconUrl?: string | null;
      };

      if (payload.organizationId !== organizationIdRef.current) return;
      if (payload.userId === currentUserIdRef.current) return;

      if (notification.eventType === 'organization:user_joined') {
        setPresenceUsers((prev) => {
          if (prev.some((u) => u.userId === payload.userId)) return prev;
          return [
            ...prev,
            {
              userId: payload.userId!,
              userName: payload.userName || 'ユーザー',
              identityIconUrl: payload.identityIconUrl,
              animState: 'entering',
            },
          ];
        });

        setTimeout(() => {
          setPresenceUsers((prev) =>
            prev.map((u) =>
              u.userId === payload.userId && u.animState === 'entering' ? { ...u, animState: 'idle' } : u,
            ),
          );
        }, 500);
      }

      if (notification.eventType === 'organization:user_left') {
        setPresenceUsers((prev) => prev.map((u) => (u.userId === payload.userId ? { ...u, animState: 'leaving' } : u)));

        setTimeout(() => {
          setPresenceUsers((prev) => prev.filter((u) => u.userId !== payload.userId));
        }, 400);
      }
    };

    const unsubscribe = onNotification(handler);
    return unsubscribe;
  }, [onNotification]);

  useEffect(() => {
    if (connectionState === 'disconnected') {
      setPresenceUsers([]);
    }
  }, [connectionState]);

  const activeUsers = presenceUsers.filter((u) => u.animState !== 'leaving');
  const visibleUsers = presenceUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, activeUsers.length - maxVisible);

  if (presenceUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {/* オンラインインジケーター */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span className="text-xs text-base-content/60">{activeUsers.length}</span>
      </div>

      {/* アバター一覧（重なりスタイル） */}
      <div className="flex -space-x-2">
        {visibleUsers.map((user, index) => {
          let animationClass = '';
          if (user.animState === 'entering') {
            animationClass = 'animate-[bubbleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]';
          } else if (user.animState === 'leaving') {
            animationClass = 'animate-[bubbleOut_0.4s_ease-in_forwards]';
          }

          return (
            <div
              key={user.userId}
              className={`relative group transition-transform hover:z-20 hover:-translate-y-0.5 ${animationClass}`}
              style={{ zIndex: presenceUsers.length - index }}
            >
              <div
                className={`w-7 h-7 rounded-full shadow-sm border-2 overflow-hidden bg-base-200 ${
                  user.animState === 'entering' ? 'border-primary' : 'border-base-100'
                }`}
              >
                <UserAvatar
                  userName={user.userName}
                  identityIconUrl={user.identityIconUrl}
                  size={24}
                  showName={false}
                />
              </div>

              {/* ツールチップ */}
              <div className="absolute bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <div className="bg-base-300 text-base-content px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                  {user.userName}
                </div>
              </div>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div
            className="w-7 h-7 rounded-full bg-base-300 flex items-center justify-center text-xs font-bold shadow-sm border-2 border-base-100 text-base-content"
            title={`他 ${hiddenCount} 人`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
    </div>
  );
}
