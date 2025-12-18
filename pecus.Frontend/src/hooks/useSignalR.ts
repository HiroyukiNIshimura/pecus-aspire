'use client';

import { useCallback, useEffect } from 'react';
import { type SignalRNotification, useSignalRContext } from '@/providers/SignalRProvider';

// ========================================
// 型定義
// ========================================

/**
 * 特定のイベントタイプに対するハンドラー
 */
export type EventHandler<T = unknown> = (payload: T, timestamp: string) => void;

/**
 * イベントハンドラーのマップ
 */
export type EventHandlers = {
  [eventType: string]: EventHandler;
};

// ========================================
// Hooks
// ========================================

/**
 * SignalR 接続状態を取得する Hook
 */
export function useSignalRConnection() {
  const { connectionState, connect, disconnect } = useSignalRContext();

  return {
    /** 現在の接続状態 */
    connectionState,
    /** 接続中かどうか */
    isConnected: connectionState === 'connected',
    /** 再接続中かどうか */
    isReconnecting: connectionState === 'reconnecting',
    /** 接続を開始する */
    connect,
    /** 接続を切断する */
    disconnect,
  };
}

/**
 * ワークスペースのリアルタイム更新を購読する Hook
 *
 * 排他的参加：このワークスペースに参加すると、前のワークスペースから自動離脱する。
 *
 * @param workspaceId ワークスペースID
 * @param handlers イベントハンドラーのマップ
 */
export function useWorkspaceUpdates(workspaceId: number | undefined, handlers?: EventHandlers) {
  const { connectionState, joinWorkspace, leaveWorkspace, onNotification } = useSignalRContext();

  // グループ参加/離脱
  useEffect(() => {
    if (!workspaceId || connectionState !== 'connected') {
      return;
    }

    joinWorkspace(workspaceId);

    return () => {
      leaveWorkspace(workspaceId);
    };
  }, [workspaceId, connectionState, joinWorkspace, leaveWorkspace]);

  // 通知ハンドラー登録
  useEffect(() => {
    if (!handlers) {
      return;
    }

    return onNotification((notification: SignalRNotification) => {
      const handler = handlers[notification.eventType];
      if (handler) {
        handler(notification.payload, notification.timestamp);
      }
    });
  }, [handlers, onNotification]);
}

/**
 * アイテム詳細表示時のリアルタイム更新を購読する Hook
 *
 * 排他的参加：このアイテムに参加すると、前のアイテムから自動離脱する。
 * ワークスペースグループにも同時参加する。
 *
 * @param itemId アイテムID
 * @param workspaceId アイテムが属するワークスペースID
 * @param handlers イベントハンドラーのマップ
 */
export function useItemUpdates(itemId: number | undefined, workspaceId: number | undefined, handlers?: EventHandlers) {
  const { connectionState, joinItem, leaveItem, onNotification } = useSignalRContext();

  // グループ参加/離脱
  useEffect(() => {
    if (!itemId || !workspaceId || connectionState !== 'connected') {
      return;
    }

    joinItem(itemId, workspaceId);

    return () => {
      leaveItem(itemId);
    };
  }, [itemId, workspaceId, connectionState, joinItem, leaveItem]);

  // 通知ハンドラー登録
  useEffect(() => {
    if (!handlers) {
      return;
    }

    return onNotification((notification: SignalRNotification) => {
      const handler = handlers[notification.eventType];
      if (handler) {
        handler(notification.payload, notification.timestamp);
      }
    });
  }, [handlers, onNotification]);
}

/**
 * タスク詳細表示時のリアルタイム更新を購読する Hook
 *
 * 排他的参加：このタスクに参加すると、前のタスクから自動離脱する。
 * ワークスペース/アイテムのグループにもサーバー側で同期される。
 */
export function useTaskUpdates(
  taskId: number | undefined,
  workspaceId: number | undefined,
  itemId?: number,
  handlers?: EventHandlers,
) {
  const { connectionState, joinTask, leaveTask, onNotification } = useSignalRContext();

  useEffect(() => {
    if (!taskId || !workspaceId || connectionState !== 'connected') {
      return;
    }

    joinTask(taskId, workspaceId, itemId);

    return () => {
      leaveTask(taskId);
    };
  }, [connectionState, itemId, joinTask, leaveTask, taskId, workspaceId]);

  useEffect(() => {
    if (!handlers) {
      return;
    }

    return onNotification((notification: SignalRNotification) => {
      const handler = handlers[notification.eventType];
      if (handler) {
        handler(notification.payload, notification.timestamp);
      }
    });
  }, [handlers, onNotification]);
}

/**
 * 全ての通知を購読する汎用 Hook
 *
 * @param handler 通知ハンドラー
 */
export function useSignalRNotifications(handler: (notification: SignalRNotification) => void) {
  const { onNotification } = useSignalRContext();

  useEffect(() => {
    return onNotification(handler);
  }, [handler, onNotification]);
}

/**
 * 特定のイベントタイプのみを購読する Hook
 *
 * @param eventType イベントタイプ
 * @param handler ハンドラー
 */
export function useSignalREvent<T = unknown>(eventType: string, handler: EventHandler<T>) {
  const { onNotification } = useSignalRContext();

  const stableHandler = useCallback(
    (notification: SignalRNotification) => {
      if (notification.eventType === eventType) {
        handler(notification.payload as T, notification.timestamp);
      }
    },
    [eventType, handler],
  );

  useEffect(() => {
    return onNotification(stableHandler);
  }, [onNotification, stableHandler]);
}
