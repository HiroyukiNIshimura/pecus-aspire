'use client';

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

    // アイテムページに遷移（モバイルではrouter.pushが動作しないことがあるためwindow.location使用）
    const url = `/workspaces/${request.workspaceCode}?itemCode=${request.itemCode}`;
    setRequest(null);
    window.location.href = url;
  };

  const handleDecline = () => {
    setRequest(null);
  };

  if (!request) return null;

  return (
    // トースト通知（左下固定）- 編集モーダルの保存ボタンを妨げない
    <div className="fixed bottom-4 left-4 z-50 w-80 animate-in slide-in-from-left-5 duration-300">
      <div className="bg-base-100 rounded-lg shadow-xl border border-base-300">
        <div className="p-4">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="icon-[mdi--bell-ring] size-5 text-primary" aria-hidden="true" />
              <h3 className="font-bold text-sm">ページ召集</h3>
            </div>
            <button
              type="button"
              onClick={handleDecline}
              className="btn btn-xs btn-circle btn-ghost"
              aria-label="閉じる"
            >
              <span className="icon-[mdi--close] size-4" aria-hidden="true" />
            </button>
          </div>

          {/* 送信者情報 */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <UserAvatar
                userName={request.senderUserName}
                isActive={true}
                identityIconUrl={request.senderIdentityIconUrl}
                size={24}
                nameClassName="text-sm font-medium"
              />
            </div>
            <p className="mt-1 text-xs text-base-content/70">さんが集まって欲しいと通知しました</p>
          </div>

          {/* アイテム情報 */}
          <div className="bg-base-200 p-2 rounded mb-3">
            <p className="text-xs text-base-content/50 font-mono">#{request.itemCode}</p>
            <p className="text-sm font-medium truncate">{request.itemSubject || '（件名未設定）'}</p>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleDecline} className="btn btn-secondary btn-sm">
              いいえ
            </button>
            <button type="button" onClick={handleAccept} className="btn btn-primary btn-sm">
              はい
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
