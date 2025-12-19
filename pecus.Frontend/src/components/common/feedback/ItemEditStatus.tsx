'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ItemEditor, ItemEditStatus as ItemEditStatusType } from '@/providers/SignalRProvider';
import { useSignalRContext } from '@/providers/SignalRProvider';

interface ItemEditStatusProps {
  itemId: number;
  currentUserId: number;
  initialStatus?: ItemEditStatusType;
  onStatusChange?: (status: ItemEditStatusType) => void;
  className?: string;
}

/**
 * アイテム編集状態を表示するコンポーネント。
 * - JoinItem の戻り値から initialStatus を受け取る（推奨）
 * - initialStatus がない場合は GetItemEditStatus で取得
 * - item:edit_started / item:edit_ended を購読してリアルタイム更新
 */
export default function ItemEditStatus({
  itemId,
  currentUserId,
  initialStatus,
  onStatusChange,
  className,
}: ItemEditStatusProps) {
  const { getItemEditStatus, onItemEditStarted, onItemEditEnded, connectionState } = useSignalRContext();
  const [status, setStatus] = useState<ItemEditStatusType>(initialStatus ?? { isEditing: false });
  const [lastItemId, setLastItemId] = useState(itemId);

  // itemId が変わった場合は状態をリセット
  if (itemId !== lastItemId) {
    setLastItemId(itemId);
    setStatus(initialStatus ?? { isEditing: false });
  }

  // initialStatus が渡されたら状態を更新
  useEffect(() => {
    if (initialStatus) {
      setStatus(initialStatus);
      onStatusChange?.(initialStatus);
    }
  }, [initialStatus, onStatusChange]);

  // initialStatus がない場合、接続が完了した時に取得
  useEffect(() => {
    // initialStatus が渡されている場合はスキップ
    if (initialStatus) return;

    // 接続していない場合はスキップ
    if (connectionState !== 'connected') return;

    let active = true;
    const fetchStatus = async () => {
      const result = await getItemEditStatus(itemId);
      if (!active) return;
      setStatus(result);
      onStatusChange?.(result);
    };

    fetchStatus();

    return () => {
      active = false;
    };
  }, [getItemEditStatus, itemId, onStatusChange, connectionState, initialStatus]);

  // イベント購読
  useEffect(() => {
    const unsubStart = onItemEditStarted((payload) => {
      if (payload.itemId !== itemId) return;
      const next: ItemEditStatusType = {
        isEditing: true,
        editor: mapEditor(payload.userId, payload.userName, payload.identityIconUrl),
      };
      setStatus(next);
      onStatusChange?.(next);
    });

    const unsubEnd = onItemEditEnded((payload) => {
      if (payload.itemId !== itemId) return;
      const next: ItemEditStatusType = { isEditing: false };
      setStatus(next);
      onStatusChange?.(next);
    });

    return () => {
      unsubStart();
      unsubEnd();
    };
  }, [itemId, onItemEditEnded, onItemEditStarted, onStatusChange]);

  // 接続断でローカル状態クリア
  useEffect(() => {
    if (connectionState === 'disconnected') {
      const cleared = { isEditing: false } as ItemEditStatusType;
      setStatus(cleared);
      onStatusChange?.(cleared);
    }
  }, [connectionState, onStatusChange]);

  const message = useMemo(() => {
    if (!status.isEditing || !status.editor) return null;
    const { editor } = status;
    if (editor.userId === currentUserId) {
      return {
        variant: 'warning' as const,
        text: 'ブラウザの別のタブで編集中です',
      };
    }
    return {
      variant: 'info' as const,
      text: `${editor.userName ?? '誰か'} さんが編集中です`,
    };
  }, [currentUserId, status]);

  if (!message) return null;

  return (
    <div className="animate-gentle-blink">
      <div className={`alert alert-soft alert-${message.variant} ${className ?? ''}`.trim()}>
        <div className="flex items-center gap-2">
          <span
            className={message.variant !== 'info' ? 'icon-[mdi--alert] w-4 h-4' : 'icon-[mdi--information] w-4 h-4'}
          />
          <span>{message.text}</span>
        </div>
      </div>
    </div>
  );
}

function mapEditor(userId: number, userName: string, identityIconUrl: string | null): ItemEditor {
  return {
    userId,
    userName,
    identityIconUrl,
  };
}
