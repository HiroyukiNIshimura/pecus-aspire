'use client';

import { type HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSignalRHubUrl, getSignalRToken } from '@/actions/signalr';

// ========================================
// 型定義
// ========================================

/**
 * SignalR 接続状態
 */
export type SignalRConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * サーバーから受信する通知の型
 */
export interface SignalRNotification {
  eventType: string;
  payload: unknown;
  timestamp: string;
}

/**
 * 通知ハンドラーの型
 */
export type NotificationHandler = (notification: SignalRNotification) => void;

/**
 * 現在参加中のグループ情報
 */
interface CurrentGroups {
  workspaceId: number | null;
  itemId: number | null;
}

/**
 * SignalR Context の値
 */
interface SignalRContextValue {
  /** 現在の接続状態 */
  connectionState: SignalRConnectionState;

  /** 接続を開始する */
  connect: () => Promise<void>;

  /** 接続を切断する */
  disconnect: () => Promise<void>;

  /** ワークスペースグループに参加（排他的：前のワークスペースから自動離脱） */
  joinWorkspace: (workspaceId: number) => Promise<void>;

  /** ワークスペースグループから離脱 */
  leaveWorkspace: (workspaceId: number) => Promise<void>;

  /** アイテムグループに参加（排他的：前のアイテムから自動離脱、ワークスペースにも参加） */
  joinItem: (itemId: number, workspaceId: number) => Promise<void>;

  /** アイテムグループから離脱 */
  leaveItem: (itemId: number) => Promise<void>;

  /** 通知ハンドラーを登録（クリーンアップ関数を返す） */
  onNotification: (handler: NotificationHandler) => () => void;

  /** 現在参加中のグループ情報 */
  currentGroups: CurrentGroups;
}

// ========================================
// Context
// ========================================

const SignalRContext = createContext<SignalRContextValue | null>(null);

// ========================================
// Provider
// ========================================

interface SignalRProviderProps {
  children: ReactNode;
  /** 自動接続を有効にする（デフォルト: true） */
  autoConnect?: boolean;
}

/**
 * SignalR 接続を管理する Provider
 *
 * ダッシュボードレイアウトで wrap して使用する。
 * - 接続時に組織グループへ自動参加（サーバー側で処理）
 * - ワークスペース/アイテムは排他的参加（1つのみ）
 */
export function SignalRProvider({ children, autoConnect = true }: SignalRProviderProps) {
  const [connectionState, setConnectionState] = useState<SignalRConnectionState>('disconnected');
  const [currentGroups, setCurrentGroups] = useState<CurrentGroups>({
    workspaceId: null,
    itemId: null,
  });

  const connectionRef = useRef<HubConnection | null>(null);
  const connectingRef = useRef<boolean>(false);
  const handlersRef = useRef<Set<NotificationHandler>>(new Set());

  /**
   * 接続を開始する
   */
  const connect = useCallback(async () => {
    // 既に接続処理中の場合は何もしない
    if (connectingRef.current) {
      return;
    }

    // 既に接続中または接続済みの場合は何もしない
    if (
      connectionRef.current &&
      (connectionRef.current.state === HubConnectionState.Connected ||
        connectionRef.current.state === HubConnectionState.Connecting ||
        connectionRef.current.state === HubConnectionState.Reconnecting)
    ) {
      return;
    }

    try {
      connectingRef.current = true;
      setConnectionState('connecting');

      // Hub URL を取得
      const hubUrl = await getSignalRHubUrl();

      // 接続を構築
      const connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: async () => {
            const token = await getSignalRToken();
            if (!token) {
              throw new Error('Failed to get access token');
            }
            return token;
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            if (retryContext.previousRetryCount < 10) return 30000;
            return null;
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      connection.serverTimeoutInMilliseconds = 30000;
      connection.keepAliveIntervalInMilliseconds = 15000;

      // イベントハンドラーを設定
      connection.onreconnecting(() => {
        console.log('[SignalR] Reconnecting...');
        setConnectionState('reconnecting');
      });

      connection.onreconnected(async () => {
        console.log('[SignalR] Reconnected');
        setConnectionState('connected');
        // 組織グループへの再参加はサーバー側の OnConnectedAsync で自動処理される
        // ワークスペース/アイテムは再参加が必要
        // ただし、再接続時に currentGroups の値を使って再参加すると
        // 状態が古い可能性があるため、ページ側で再参加を呼び出す設計とする
      });

      connection.onclose((error) => {
        console.log('[SignalR] Connection closed', error);
        setConnectionState('disconnected');
        setCurrentGroups({ workspaceId: null, itemId: null });
      });

      // 通知受信ハンドラー
      connection.on('ReceiveNotification', (notification: SignalRNotification) => {
        console.log('[SignalR] Notification received:', notification.eventType);
        for (const handler of handlersRef.current) {
          try {
            handler(notification);
          } catch (error) {
            console.error('[SignalR] Notification handler error:', error);
          }
        }
      });

      // 接続を開始
      await connection.start();
      connectionRef.current = connection;
      setConnectionState('connected');
      console.log('[SignalR] Connected (organization group joined automatically)');
    } catch (error) {
      console.error('[SignalR] Connection failed:', error);
      setConnectionState('disconnected');
    } finally {
      connectingRef.current = false;
    }
  }, []);

  /**
   * 接続を切断する
   */
  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop();
      } catch (error) {
        console.error('[SignalR] Disconnect error:', error);
      }
      connectionRef.current = null;
      setCurrentGroups({ workspaceId: null, itemId: null });
      setConnectionState('disconnected');
    }
  }, []);

  /**
   * ワークスペースグループに参加（排他的）
   */
  const joinWorkspace = useCallback(
    async (workspaceId: number) => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        console.warn('[SignalR] Cannot join workspace: not connected');
        return;
      }

      // 既に同じワークスペースに参加済みの場合はスキップ
      if (currentGroups.workspaceId === workspaceId) {
        console.log(`[SignalR] Already in workspace: ${workspaceId}`);
        return;
      }

      try {
        // サーバー側で前のワークスペースからの離脱も処理
        await connection.invoke('JoinWorkspace', workspaceId, currentGroups.workspaceId ?? 0);
        setCurrentGroups((prev) => ({
          ...prev,
          workspaceId,
          itemId: null, // ワークスペース移動時はアイテムもクリア
        }));
        console.log(`[SignalR] Joined workspace: ${workspaceId}`);
      } catch (error) {
        console.error('[SignalR] Failed to join workspace:', error);
      }
    },
    [currentGroups.workspaceId],
  );

  /**
   * ワークスペースグループから離脱
   */
  const leaveWorkspace = useCallback(async (workspaceId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      setCurrentGroups((prev) => ({
        ...prev,
        workspaceId: prev.workspaceId === workspaceId ? null : prev.workspaceId,
        itemId: null,
      }));
      return;
    }

    try {
      await connection.invoke('LeaveWorkspace', workspaceId);
      setCurrentGroups((prev) => ({
        ...prev,
        workspaceId: prev.workspaceId === workspaceId ? null : prev.workspaceId,
        itemId: null,
      }));
      console.log(`[SignalR] Left workspace: ${workspaceId}`);
    } catch (error) {
      console.error('[SignalR] Failed to leave workspace:', error);
    }
  }, []);

  /**
   * アイテムグループに参加（排他的、ワークスペースにも同時参加）
   */
  const joinItem = useCallback(
    async (itemId: number, workspaceId: number) => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        console.warn('[SignalR] Cannot join item: not connected');
        return;
      }

      // 既に同じアイテムに参加済みの場合はスキップ
      if (currentGroups.itemId === itemId) {
        console.log(`[SignalR] Already viewing item: ${itemId}`);
        return;
      }

      try {
        await connection.invoke(
          'JoinItem',
          itemId,
          workspaceId,
          currentGroups.itemId ?? 0,
          currentGroups.workspaceId ?? 0,
        );
        setCurrentGroups({
          workspaceId,
          itemId,
        });
        console.log(`[SignalR] Joined item: ${itemId} in workspace: ${workspaceId}`);
      } catch (error) {
        console.error('[SignalR] Failed to join item:', error);
      }
    },
    [currentGroups.itemId, currentGroups.workspaceId],
  );

  /**
   * アイテムグループから離脱（ワークスペースには残る）
   */
  const leaveItem = useCallback(async (itemId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      setCurrentGroups((prev) => ({
        ...prev,
        itemId: prev.itemId === itemId ? null : prev.itemId,
      }));
      return;
    }

    try {
      await connection.invoke('LeaveItem', itemId);
      setCurrentGroups((prev) => ({
        ...prev,
        itemId: prev.itemId === itemId ? null : prev.itemId,
      }));
      console.log(`[SignalR] Left item: ${itemId}`);
    } catch (error) {
      console.error('[SignalR] Failed to leave item:', error);
    }
  }, []);

  /**
   * 通知ハンドラーを登録
   */
  const onNotification = useCallback((handler: NotificationHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  // 自動接続
  useEffect(() => {
    let isMounted = true;

    const startConnection = async () => {
      if (autoConnect && isMounted) {
        await connect();
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [autoConnect, connect]);

  const value: SignalRContextValue = {
    connectionState,
    connect,
    disconnect,
    joinWorkspace,
    leaveWorkspace,
    joinItem,
    leaveItem,
    onNotification,
    currentGroups,
  };

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
}

// ========================================
// Hook
// ========================================

/**
 * SignalR Context を取得する Hook
 */
export function useSignalRContext(): SignalRContextValue {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalRContext must be used within a SignalRProvider');
  }
  return context;
}
