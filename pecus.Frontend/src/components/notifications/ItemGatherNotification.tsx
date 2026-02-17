'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import { useCurrentUserId } from '@/providers/AppSettingsProvider';
import { type SignalRNotification, useSignalRContext } from '@/providers/SignalRProvider';

interface GatherRequest {
  workspaceId: number;
  itemId: number;
  itemCode: string;
  workspaceCode: string;
  itemSubject: string | null;
  senderUserId: number;
  senderUserName: string;
  senderIdentityIconUrl: string | null;
  memberIds: number[];
}

/**
 * アイテムページへの召集通知を表示するコンポーネント
 */
export function ItemGatherNotification() {
  const router = useRouter();
  const { onNotification } = useSignalRContext();
  const currentUserId = useCurrentUserId();
  const [request, setRequest] = useState<GatherRequest | null>(null);

  useEffect(() => {
    const unsubscribe = onNotification((notification: SignalRNotification) => {
      if (notification.eventType === 'item:gather_request') {
        const payload = notification.payload as GatherRequest;

        // ワークスペースメンバーかどうかをフィルタリング
        if (!payload.memberIds || !payload.memberIds.includes(currentUserId)) {
          return;
        }

        // モーダル表示中は新規通知を無視（最初の召集に集中）
        setRequest((prevRequest) => {
          if (prevRequest) {
            return prevRequest;
          }
          return payload;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onNotification, currentUserId]);

  const handleAccept = () => {
    if (!request) return;

    // アイテムページに遷移
    const url = `/workspaces/${request.workspaceCode}?itemCode=${request.itemCode}`;
    router.push(url);

    // ダイアログを閉じる
    setRequest(null);
  };

  const handleDecline = () => {
    setRequest(null);
  };

  if (!request) return null;

  return (
    <>
      {/* モーダル背景オーバーレイ */}
      <div className="fixed inset-0 bg-black/50 z-60" aria-hidden="true" />

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">ページ召集の通知</h3>
              <button
                type="button"
                onClick={handleDecline}
                className="btn btn-sm btn-circle btn-ghost"
                aria-label="閉じる"
              >
                <span className="icon-[mdi--close] size-5" aria-hidden="true" />
              </button>
            </div>

            {/* 送信者情報 */}
            <div className="mb-4">
              <UserAvatar
                userName={request.senderUserName}
                isActive={true}
                identityIconUrl={request.senderIdentityIconUrl}
                size={32}
                nameClassName="font-semibold"
              />
              <p className="mt-2 text-sm text-base-content/70">
                {request.senderUserName} さんがこのページに集まって欲しいと通知しました
              </p>
            </div>

            {/* アイテム情報 */}
            <div className="bg-base-200 p-3 rounded-lg mb-4">
              <p className="text-xs text-base-content/50 font-mono mb-1">#{request.itemCode}</p>
              <p className="font-semibold">{request.itemSubject || '（件名未設定）'}</p>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={handleDecline} className="btn btn-secondary">
                いいえ
              </button>
              <button type="button" onClick={handleAccept} className="btn btn-primary">
                はい
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
