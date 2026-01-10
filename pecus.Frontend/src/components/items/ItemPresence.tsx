'use client';

import { useEffect, useRef, useState } from 'react';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import { type ItemPresenceUser, type SignalRNotification, useSignalRContext } from '@/providers/SignalRProvider';

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

interface ItemPresenceProps {
  itemId: number;
  currentUserId: number;
  /** 初期ユーザー一覧（JoinItemの戻り値） */
  initialUsers?: ItemPresenceUser[];
  /** コンパクト表示（アイテム詳細ヘッダー用） */
  compact?: boolean;
  maxVisible?: number;
}

/**
 * アイテムをリアルタイムで閲覧中のユーザーを表示するコンポーネント
 * 「このアイテムを見ている人」を表示
 */
export default function ItemPresence({
  itemId,
  currentUserId,
  initialUsers = [],
  compact = false,
  maxVisible = 5,
}: ItemPresenceProps) {
  const { onNotification, connectionState } = useSignalRContext();
  const [presenceUsers, setPresenceUsers] = useState<PresenceUserState[]>([]);
  const lastInitialUsersLengthRef = useRef(-1);

  const itemIdRef = useRef(itemId);
  const currentUserIdRef = useRef(currentUserId);
  itemIdRef.current = itemId;
  currentUserIdRef.current = currentUserId;

  // 初期ユーザー一覧を設定（initialUsersが更新されたら反映）
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
      if (notification.eventType !== 'item:user_joined' && notification.eventType !== 'item:user_left') {
        return;
      }

      const payload = notification.payload as {
        itemId?: number;
        userId?: number;
        userName?: string;
        identityIconUrl?: string | null;
      };

      if (payload.itemId !== itemIdRef.current) return;
      if (payload.userId === currentUserIdRef.current) return;

      if (notification.eventType === 'item:user_joined') {
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

      if (notification.eventType === 'item:user_left') {
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

  // itemIdが変わったら状態をクリア
  useEffect(() => {
    setPresenceUsers([]);
    lastInitialUsersLengthRef.current = -1;
  }, [itemId]);

  const activeUsers = presenceUsers.filter((u) => u.animState !== 'leaving');
  const visibleUsers = presenceUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, activeUsers.length - maxVisible);

  if (presenceUsers.length === 0) return null;

  // コンパクト表示（インライン）
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-base-content/60">
        <span className="icon-[mdi--eye] w-3.5 h-3.5" />
        <span>{activeUsers.length}人が閲覧中</span>
        <div className="flex -space-x-1.5">
          {visibleUsers.slice(0, 3).map((user) => (
            <div
              key={user.userId}
              className="w-5 h-5 rounded-full border border-base-100 overflow-hidden bg-base-200"
              title={user.userName}
            >
              <UserAvatar userName={user.userName} identityIconUrl={user.identityIconUrl} size={18} showName={false} />
            </div>
          ))}
          {activeUsers.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center text-[10px] font-bold border border-base-100 text-base-content">
              +{activeUsers.length - 3}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 通常表示
  return (
    <div className="flex items-center gap-2 p-2 bg-base-200/50 rounded-lg">
      {/* アイコンとラベル */}
      <div className="flex items-center gap-1.5">
        <span className="icon-[mdi--eye] w-4 h-4 text-base-content/60" />
        <span className="text-xs text-base-content/60">{activeUsers.length}人が閲覧中</span>
      </div>

      {/* アバター一覧 */}
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
