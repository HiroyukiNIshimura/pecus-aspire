'use client';

import { useEffect, useRef, useState } from 'react';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import { type SignalRNotification, useSignalRContext, type WorkspacePresenceUser } from '@/providers/SignalRProvider';

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

interface WorkspacePresenceProps {
  workspaceId: number;
  currentUserId: number;
  /** 初期ユーザー一覧（JoinWorkspaceの戻り値） */
  initialUsers?: WorkspacePresenceUser[];
  maxVisible?: number;
}

/**
 * ワークスペースにリアルタイムで参加中のユーザーを表示するコンポーネント
 * フローティング・バブル形式でアニメーション付きで表示
 */
export default function WorkspacePresence({
  workspaceId,
  currentUserId,
  initialUsers = [],
  maxVisible = 5,
}: WorkspacePresenceProps) {
  const { onNotification, connectionState } = useSignalRContext();
  const [presenceUsers, setPresenceUsers] = useState<PresenceUserState[]>([]);
  // 前回処理した initialUsers の長さを追跡（変更があったら再処理）
  const lastInitialUsersLengthRef = useRef(-1);

  const workspaceIdRef = useRef(workspaceId);
  const currentUserIdRef = useRef(currentUserId);
  workspaceIdRef.current = workspaceId;
  currentUserIdRef.current = currentUserId;

  // 初期ユーザー一覧を設定（initialUsersが更新されたら反映）
  useEffect(() => {
    // initialUsersが空でなく、かつ前回と異なる場合のみ処理
    if (initialUsers.length === 0) return;
    if (lastInitialUsersLengthRef.current === initialUsers.length) return;
    lastInitialUsersLengthRef.current = initialUsers.length;

    // 自分以外のユーザーを初期状態として設定（アニメーションなしでidle状態）
    const otherUsers = initialUsers.filter((u) => u.userId !== currentUserId);
    if (otherUsers.length > 0) {
      setPresenceUsers((prev) => {
        // 既に存在するユーザーは追加しない
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
      if (notification.eventType !== 'workspace:user_joined' && notification.eventType !== 'workspace:user_left') {
        return;
      }

      const payload = notification.payload as {
        workspaceId?: number;
        userId?: number;
        userName?: string;
        identityIconUrl?: string | null;
      };

      if (payload.workspaceId !== workspaceIdRef.current) return;
      if (payload.userId === currentUserIdRef.current) return;

      if (notification.eventType === 'workspace:user_joined') {
        setPresenceUsers((prev) => {
          // 既に存在する場合はスキップ（leaving中のユーザーも含む）
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

        // 入場アニメーション終了後にidleに変更
        setTimeout(() => {
          setPresenceUsers((prev) =>
            prev.map((u) =>
              u.userId === payload.userId && u.animState === 'entering' ? { ...u, animState: 'idle' } : u,
            ),
          );
        }, 500);
      }

      if (notification.eventType === 'workspace:user_left') {
        // leavingに変更してアニメーション開始
        setPresenceUsers((prev) => prev.map((u) => (u.userId === payload.userId ? { ...u, animState: 'leaving' } : u)));

        // アニメーション終了後に削除
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

  // 離脱中のユーザーはカウントしない
  const activeUsers = presenceUsers.filter((u) => u.animState !== 'leaving');
  const visibleUsers = presenceUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, activeUsers.length - maxVisible);

  if (presenceUsers.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* オンライン表示ラベル */}
      <div className="flex items-center gap-2 mb-2 justify-end">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
        </span>
        <span className="text-xs text-base-content/60 font-medium">{activeUsers.length}人がオンライン</span>
      </div>

      {/* アバターバブル */}
      <div className="flex flex-row-reverse items-end gap-1">
        {hiddenCount > 0 && (
          <div
            className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-base-100 text-base-content"
            title={`他 ${hiddenCount} 人`}
          >
            +{hiddenCount}
          </div>
        )}

        {visibleUsers.map((user, index) => {
          // アニメーションクラス
          let animationClass = '';
          if (user.animState === 'entering') {
            animationClass = 'animate-[bubbleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]';
          } else if (user.animState === 'leaving') {
            animationClass = 'animate-[bubbleOut_0.4s_ease-in_forwards]';
          } else {
            animationClass = 'animate-[float_3s_ease-in-out_infinite]';
          }

          return (
            <div
              key={user.userId}
              className={`transform transition-all duration-300 hover:scale-110 hover:-translate-y-1 ${animationClass}`}
              style={{
                zIndex: presenceUsers.length - index,
                animationDelay: user.animState === 'idle' ? `${index * 0.5}s` : '0s',
              }}
            >
              <div className="relative group">
                <div
                  className={`w-10 h-10 rounded-full shadow-lg border-2 overflow-hidden bg-base-200 flex items-center justify-center transition-colors duration-300 ${
                    user.animState === 'entering' ? 'border-primary' : 'border-base-100'
                  }`}
                >
                  <UserAvatar
                    userName={user.userName}
                    identityIconUrl={user.identityIconUrl}
                    size={36}
                    showName={false}
                  />
                </div>

                {/* ホバー時のツールチップ */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-base-300 text-base-content px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                    {user.userName}
                  </div>
                </div>

                {/* 新規参加時のリング */}
                {user.animState === 'entering' && (
                  <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping opacity-75" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
