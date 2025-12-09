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
 * SignalR Context の値
 */
interface SignalRContextValue {
  /** 現在の接続状態 */
  connectionState: SignalRConnectionState;

  /** 接続を開始する */
  connect: () => Promise<void>;

  /** 接続を切断する */
  disconnect: () => Promise<void>;

  /** 組織グループに参加 */
  joinOrganization: (organizationId: number) => Promise<void>;

  /** 組織グループから離脱 */
  leaveOrganization: (organizationId: number) => Promise<void>;

  /** ワークスペースグループに参加 */
  joinWorkspace: (workspaceId: number, userName?: string) => Promise<void>;

  /** ワークスペースグループから離脱 */
  leaveWorkspace: (workspaceId: number) => Promise<void>;

  /** 通知ハンドラーを登録（クリーンアップ関数を返す） */
  onNotification: (handler: NotificationHandler) => () => void;
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
 * ログイン済みのページで wrap して使用する。
 * 自動再接続、グループ管理、通知受信を提供。
 */
export function SignalRProvider({ children, autoConnect = true }: SignalRProviderProps) {
  const [connectionState, setConnectionState] = useState<SignalRConnectionState>('disconnected');
  const connectionRef = useRef<HubConnection | null>(null);
  const connectingRef = useRef<boolean>(false); // 接続中フラグ（重複接続防止）
  const handlersRef = useRef<Set<NotificationHandler>>(new Set());
  const joinedGroupsRef = useRef<Set<string>>(new Set());

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
          // カスタム再接続間隔（0秒、2秒、10秒、30秒、null で停止）
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            if (retryContext.previousRetryCount < 10) return 30000;
            // 10回以上失敗したら停止
            return null;
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      // サーバータイムアウト設定（サーバー側の ClientTimeoutInterval と合わせる）
      connection.serverTimeoutInMilliseconds = 30000; // 30秒
      connection.keepAliveIntervalInMilliseconds = 15000; // 15秒

      // イベントハンドラーを設定
      connection.onreconnecting(() => {
        console.log('[SignalR] Reconnecting...');
        setConnectionState('reconnecting');
      });

      connection.onreconnected(async () => {
        console.log('[SignalR] Reconnected');
        setConnectionState('connected');

        // 再接続時にグループを再参加
        for (const group of joinedGroupsRef.current) {
          try {
            const [type, id] = group.split(':');
            if (type === 'organization') {
              await connection.invoke('JoinOrganization', id);
            } else if (type === 'workspace') {
              await connection.invoke('JoinWorkspace', id);
            }
          } catch (error) {
            console.error(`[SignalR] Failed to rejoin group ${group}:`, error);
          }
        }
      });

      connection.onclose((error) => {
        console.log('[SignalR] Connection closed', error);
        setConnectionState('disconnected');
        joinedGroupsRef.current.clear();
      });

      // 通知受信ハンドラー
      connection.on('ReceiveNotification', (notification: SignalRNotification) => {
        console.log('[SignalR] Notification received:', notification.eventType, 'handlers:', handlersRef.current.size);
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
      console.log('[SignalR] Connected');
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
      joinedGroupsRef.current.clear();
      setConnectionState('disconnected');
    }
  }, []);

  /**
   * 組織グループに参加
   */
  const joinOrganization = useCallback(async (organizationId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot join organization: not connected');
      return;
    }

    const groupKey = `organization:${organizationId}`;

    // 既に参加済みの場合はスキップ（クライアント側のトラッキング用）
    if (joinedGroupsRef.current.has(groupKey)) {
      console.log(`[SignalR] Already joined organization: ${organizationId}`);
      return;
    }

    try {
      await connection.invoke('JoinOrganization', organizationId);
      joinedGroupsRef.current.add(groupKey);
      console.log(`[SignalR] Joined organization: ${organizationId}`);
    } catch (error) {
      console.error('[SignalR] Failed to join organization:', error);
    }
  }, []);

  /**
   * 組織グループから離脱
   */
  const leaveOrganization = useCallback(async (organizationId: number) => {
    const groupKey = `organization:${organizationId}`;
    joinedGroupsRef.current.delete(groupKey);

    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await connection.invoke('LeaveOrganization', organizationId);
      console.log(`[SignalR] Left organization: ${organizationId}`);
    } catch (error) {
      console.error('[SignalR] Failed to leave organization:', error);
    }
  }, []);

  /**
   * ワークスペースグループに参加
   * @param workspaceId ワークスペースID（整数）
   * @param userName 現在のユーザー名（通知表示用）
   */
  const joinWorkspace = useCallback(async (workspaceId: number, userName?: string) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot join workspace: not connected');
      return;
    }

    const groupKey = `workspace:${workspaceId}`;

    // 既に参加済みの場合はスキップ（クライアント側のトラッキング用）
    if (joinedGroupsRef.current.has(groupKey)) {
      console.log(`[SignalR] Already joined workspace: ${workspaceId}`);
      return;
    }

    try {
      // サーバー側で重複通知を防ぐため、クライアント側では単純に呼び出す
      await connection.invoke('JoinWorkspace', workspaceId, userName ?? 'Unknown');
      joinedGroupsRef.current.add(groupKey);
      console.log(`[SignalR] Joined workspace: ${workspaceId}`);
    } catch (error) {
      console.error('[SignalR] Failed to join workspace:', error);
    }
  }, []);

  /**
   * ワークスペースグループから離脱
   */
  const leaveWorkspace = useCallback(async (workspaceId: number) => {
    const groupKey = `workspace:${workspaceId}`;
    joinedGroupsRef.current.delete(groupKey);

    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await connection.invoke('LeaveWorkspace', workspaceId);
      console.log(`[SignalR] Left workspace: ${workspaceId}`);
    } catch (error) {
      console.error('[SignalR] Failed to leave workspace:', error);
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
    // StrictMode による二重実行を防ぐためのフラグ
    let isMounted = true;

    const startConnection = async () => {
      if (autoConnect && isMounted) {
        await connect();
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      // クリーンアップ時に接続を切断
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
    joinOrganization,
    leaveOrganization,
    joinWorkspace,
    leaveWorkspace,
    onNotification,
  };

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
}

// ========================================
// Hook
// ========================================

/**
 * SignalR Context を取得する Hook
 *
 * SignalRProvider の外で使用するとエラーをスローする。
 */
export function useSignalRContext(): SignalRContextValue {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalRContext must be used within a SignalRProvider');
  }
  return context;
}
