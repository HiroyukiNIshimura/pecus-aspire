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
 * 組織のリアルタイム更新を購読する Hook
 *
 * @param organizationId 組織ID
 * @param handlers イベントハンドラーのマップ
 */
export function useOrganizationUpdates(organizationId: string | undefined, handlers?: EventHandlers) {
  const { connectionState, joinOrganization, leaveOrganization, onNotification } = useSignalRContext();

  // グループ参加/離脱
  useEffect(() => {
    if (!organizationId || connectionState !== 'connected') {
      return;
    }

    joinOrganization(organizationId);

    return () => {
      leaveOrganization(organizationId);
    };
  }, [organizationId, connectionState, joinOrganization, leaveOrganization]);

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
 * ワークスペースのリアルタイム更新を購読する Hook
 *
 * @param workspaceId ワークスペースID
 * @param handlers イベントハンドラーのマップ
 */
export function useWorkspaceUpdates(workspaceId: string | undefined, handlers?: EventHandlers) {
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
