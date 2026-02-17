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
 * ワークスペースプレゼンスユーザー情報（サーバーから返される）
 */
export interface WorkspacePresenceUser {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

/**
 * 組織プレゼンスユーザー情報（サーバーから返される）
 */
export interface OrganizationPresenceUser {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

/**
 * アイテムプレゼンスユーザー情報（サーバーから返される）
 */
export interface ItemPresenceUser {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

/**
 * タスクプレゼンスユーザー情報（サーバーから返される）
 */
export interface TaskPresenceUser {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

/**
 * アイテム編集者情報
 */
export interface ItemEditor {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
  connectionId?: string | null;
}

/**
 * ワークスペース編集者情報
 */
export interface WorkspaceEditor {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
  connectionId?: string | null;
}

/**
 * タスク編集者情報
 */
export interface TaskEditor {
  userId: number;
  userName: string;
  identityIconUrl: string | null;
  connectionId?: string | null;
}

/**
 * アイテム編集状態
 */
export interface ItemEditStatus {
  isEditing: boolean;
  editor?: ItemEditor;
}

/**
 * ワークスペース編集状態
 */
export interface WorkspaceEditStatus {
  isEditing: boolean;
  editor?: WorkspaceEditor;
}

/**
 * タスク編集状態
 */
export interface TaskEditStatus {
  isEditing: boolean;
  editor?: TaskEditor;
}

/**
 * JoinItem の戻り値
 */
export interface JoinItemResult {
  existingUsers: ItemPresenceUser[];
  editStatus: ItemEditStatus;
}

/**
 * JoinWorkspace の戻り値
 */
export interface JoinWorkspaceResult {
  existingUsers: WorkspacePresenceUser[];
  editStatus: WorkspaceEditStatus;
}

/**
 * JoinTask の戻り値
 */
export interface JoinTaskResult {
  existingUsers: TaskPresenceUser[];
  editStatus: TaskEditStatus;
}

interface ItemEditStartedPayload {
  itemId: number;
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

interface ItemEditEndedPayload {
  itemId: number;
  userId: number;
}

interface WorkspaceEditStartedPayload {
  workspaceId: number;
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

interface WorkspaceEditEndedPayload {
  workspaceId: number;
  userId: number;
}

interface TaskEditStartedPayload {
  taskId: number;
  userId: number;
  userName: string;
  identityIconUrl: string | null;
}

interface TaskEditEndedPayload {
  taskId: number;
  userId: number;
}

/**
 * 現在参加中のグループ情報
 */
interface CurrentGroups {
  workspaceId: number | null;
  itemId: number | null;
  taskId: number | null;
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

  /** ワークスペースグループに参加（排他的：前のワークスペースから自動離脱）
   *  @returns 既にワークスペースにいるユーザー一覧と編集状態
   */
  joinWorkspace: (workspaceId: number) => Promise<JoinWorkspaceResult>;

  /** ワークスペースグループから離脱 */
  leaveWorkspace: (workspaceId: number) => Promise<void>;

  /** アイテムグループに参加（排他的：前のアイテムから自動離脱、ワークスペースにも参加）
   *  @returns 既にアイテムにいるユーザー一覧と編集状態
   */
  joinItem: (itemId: number, workspaceId: number) => Promise<JoinItemResult>;

  /** アイテムグループから離脱 */
  leaveItem: (itemId: number) => Promise<void>;

  /** タスクグループに参加（排他的：前のタスクから自動離脱、ワークスペース/アイテムも同期）
   *  @returns 既にタスクにいるユーザー一覧と編集状態
   */
  joinTask: (taskId: number, workspaceId: number, itemId?: number) => Promise<JoinTaskResult>;

  /** タスクグループから離脱 */
  leaveTask: (taskId: number) => Promise<void>;

  /** チャットルームグループに参加 */
  joinChat: (chatRoomId: number) => Promise<void>;

  /** チャットルームグループから離脱 */
  leaveChat: (chatRoomId: number) => Promise<void>;

  /** チャット入力中通知を送信 */
  sendChatTyping: (chatRoomId: number, isTyping?: boolean) => Promise<void>;

  /** 通知ハンドラーを登録（クリーンアップ関数を返す） */
  onNotification: (handler: NotificationHandler) => () => void;

  /** アイテム編集開始 */
  startItemEdit: (itemId: number) => Promise<void>;

  /** アイテム編集終了 */
  endItemEdit: (itemId: number) => Promise<void>;

  /** アイテム編集状態を取得 */
  getItemEditStatus: (itemId: number) => Promise<ItemEditStatus>;

  /** アイテム編集開始イベント購読 */
  onItemEditStarted: (handler: (payload: ItemEditStartedPayload) => void) => () => void;

  /** アイテム編集終了イベント購読 */
  onItemEditEnded: (handler: (payload: ItemEditEndedPayload) => void) => () => void;

  /** ワークスペース編集開始 */
  startWorkspaceEdit: (workspaceId: number) => Promise<void>;

  /** ワークスペース編集終了 */
  endWorkspaceEdit: (workspaceId: number) => Promise<void>;

  /** ワークスペース編集状態を取得 */
  getWorkspaceEditStatus: (workspaceId: number) => Promise<WorkspaceEditStatus>;

  /** アイテムページへのメンバー召集をリクエスト */
  requestItemGather: (workspaceId: number, itemId: number) => Promise<void>;

  /** ワークスペース編集開始イベント購読 */
  onWorkspaceEditStarted: (handler: (payload: WorkspaceEditStartedPayload) => void) => () => void;

  /** ワークスペース編集終了イベント購読 */
  onWorkspaceEditEnded: (handler: (payload: WorkspaceEditEndedPayload) => void) => () => void;

  /** タスク編集開始 */
  startTaskEdit: (taskId: number) => Promise<void>;

  /** タスク編集終了 */
  endTaskEdit: (taskId: number) => Promise<void>;

  /** タスク編集状態を取得 */
  getTaskEditStatus: (taskId: number) => Promise<TaskEditStatus>;

  /** タスク編集開始イベント購読 */
  onTaskEditStarted: (handler: (payload: TaskEditStartedPayload) => void) => () => void;

  /** タスク編集終了イベント購読 */
  onTaskEditEnded: (handler: (payload: TaskEditEndedPayload) => void) => () => void;

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
    taskId: null,
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
        setCurrentGroups({ workspaceId: null, itemId: null, taskId: null });
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
      setCurrentGroups({ workspaceId: null, itemId: null, taskId: null });
      setConnectionState('disconnected');
    }
  }, []);

  /**
   * ワークスペースグループに参加（排他的）
   * 注意: 同じワークスペースに再参加しても編集状態を取得するため、サーバーに問い合わせる
   */
  const joinWorkspace = useCallback(async (workspaceId: number): Promise<JoinWorkspaceResult> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot join workspace: not connected');
      return { existingUsers: [], editStatus: { isEditing: false } };
    }

    try {
      // サーバー側で前のワークスペースからの離脱も処理（Redis で状態管理）
      // 戻り値は既存のプレゼンスユーザー一覧と編集状態
      const result = await connection.invoke<JoinWorkspaceResult>('JoinWorkspace', workspaceId);
      setCurrentGroups((prev) => ({
        ...prev,
        workspaceId,
        itemId: null, // ワークスペース移動時はアイテムもクリア
        taskId: null,
      }));
      console.log(`[SignalR] Joined workspace: ${workspaceId}`);
      return result ?? { existingUsers: [], editStatus: { isEditing: false } };
    } catch (error) {
      console.error('[SignalR] Failed to join workspace:', error);
      return { existingUsers: [], editStatus: { isEditing: false } };
    }
  }, []);

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
        taskId: null,
      }));
      return;
    }

    try {
      await connection.invoke('LeaveWorkspace', workspaceId);
      setCurrentGroups((prev) => ({
        ...prev,
        workspaceId: prev.workspaceId === workspaceId ? null : prev.workspaceId,
        itemId: null,
        taskId: null,
      }));
      console.log(`[SignalR] Left workspace: ${workspaceId}`);
    } catch (error) {
      console.error('[SignalR] Failed to leave workspace:', error);
    }
  }, []);

  /**
   * アイテムグループに参加（排他的、ワークスペースにも同時参加）
   * 注意: 同じアイテムに再参加しても編集状態を取得するため、サーバーに問い合わせる
   */
  const joinItem = useCallback(async (itemId: number, workspaceId: number): Promise<JoinItemResult> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot join item: not connected');
      return { existingUsers: [], editStatus: { isEditing: false } };
    }

    try {
      // サーバー側で前のアイテム/ワークスペースからの離脱も処理（Redis で状態管理）
      // 戻り値は既存のプレゼンスユーザー一覧と編集状態
      const result = await connection.invoke<JoinItemResult>('JoinItem', itemId, workspaceId);
      setCurrentGroups({
        workspaceId,
        itemId,
        taskId: null,
      });
      console.log(`[SignalR] Joined item: ${itemId} in workspace: ${workspaceId}`);
      return result ?? { existingUsers: [], editStatus: { isEditing: false } };
    } catch (error) {
      console.error('[SignalR] Failed to join item:', error);
      return { existingUsers: [], editStatus: { isEditing: false } };
    }
  }, []);

  /**
   * アイテムグループから離脱（ワークスペースには残る）
   */
  const leaveItem = useCallback(async (itemId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      setCurrentGroups((prev) => ({
        ...prev,
        itemId: prev.itemId === itemId ? null : prev.itemId,
        taskId: null,
      }));
      return;
    }

    try {
      await connection.invoke('LeaveItem', itemId);
      setCurrentGroups((prev) => ({
        ...prev,
        itemId: prev.itemId === itemId ? null : prev.itemId,
        taskId: null,
      }));
      console.log(`[SignalR] Left item: ${itemId}`);
    } catch (error) {
      console.error('[SignalR] Failed to leave item:', error);
    }
  }, []);

  /**
   * タスクグループに参加（排他的、ワークスペース/アイテムも同期）
   * 注意: 同じタスクに再参加しても編集状態を取得するため、サーバーに問い合わせる
   */
  const joinTask = useCallback(
    async (taskId: number, workspaceId: number, itemId?: number): Promise<JoinTaskResult> => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        console.warn('[SignalR] Cannot join task: not connected');
        return { existingUsers: [], editStatus: { isEditing: false } };
      }

      try {
        const result = await connection.invoke<JoinTaskResult>('JoinTask', workspaceId, taskId);
        setCurrentGroups({
          workspaceId,
          itemId: itemId ?? currentGroups.itemId,
          taskId,
        });
        console.log(`[SignalR] Joined task: ${taskId} in workspace: ${workspaceId}`);
        return result ?? { existingUsers: [], editStatus: { isEditing: false } };
      } catch (error) {
        console.error('[SignalR] Failed to join task:', error);
        return { existingUsers: [], editStatus: { isEditing: false } };
      }
    },
    [currentGroups.itemId],
  );

  /**
   * タスクグループから離脱
   */
  const leaveTask = useCallback(async (taskId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      setCurrentGroups((prev) => ({
        ...prev,
        taskId: prev.taskId === taskId ? null : prev.taskId,
      }));
      return;
    }

    try {
      await connection.invoke('LeaveTask', taskId);
      setCurrentGroups((prev) => ({
        ...prev,
        taskId: prev.taskId === taskId ? null : prev.taskId,
      }));
      console.log(`[SignalR] Left task: ${taskId}`);
    } catch (error) {
      console.error('[SignalR] Failed to leave task:', error);
    }
  }, []);

  /**
   * チャットルームグループに参加
   */
  const joinChat = useCallback(async (chatRoomId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot join chat: not connected');
      return;
    }

    try {
      await connection.invoke('JoinChat', chatRoomId);
      console.log(`[SignalR] Joined chat: ${chatRoomId}`);
    } catch (error) {
      console.error('[SignalR] Failed to join chat:', error);
    }
  }, []);

  /**
   * チャットルームグループから離脱
   */
  const leaveChat = useCallback(async (chatRoomId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await connection.invoke('LeaveChat', chatRoomId);
      console.log(`[SignalR] Left chat: ${chatRoomId}`);
    } catch (error) {
      console.error('[SignalR] Failed to leave chat:', error);
    }
  }, []);

  /**
   * チャット入力中通知を送信
   */
  const sendChatTyping = useCallback(async (chatRoomId: number, isTyping = true) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await connection.invoke('SendChatTyping', chatRoomId, isTyping);
    } catch (error) {
      console.error('[SignalR] Failed to send chat typing:', error);
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

  /**
   * アイテム編集開始
   */
  const startItemEdit = useCallback(async (itemId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot start item edit: not connected');
      return;
    }

    if (itemId <= 0) {
      console.warn('[SignalR] Invalid itemId for startItemEdit');
      return;
    }

    try {
      await connection.invoke('StartItemEdit', itemId);
    } catch (error) {
      console.error('[SignalR] Failed to start item edit:', error);
    }
  }, []);

  /**
   * アイテム編集終了
   */
  const endItemEdit = useCallback(async (itemId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    if (itemId <= 0) {
      return;
    }

    try {
      await connection.invoke('EndItemEdit', itemId);
    } catch (error) {
      console.error('[SignalR] Failed to end item edit:', error);
    }
  }, []);

  /**
   * アイテム編集状態取得
   */
  const getItemEditStatus = useCallback(async (itemId: number): Promise<ItemEditStatus> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return { isEditing: false };
    }

    if (itemId <= 0) {
      return { isEditing: false };
    }

    try {
      const status = await connection.invoke<ItemEditStatus>('GetItemEditStatus', itemId);
      if (!status) return { isEditing: false };
      return status;
    } catch (error) {
      console.error('[SignalR] Failed to get item edit status:', error);
      return { isEditing: false };
    }
  }, []);

  /**
   * アイテム編集開始イベント購読
   */
  const onItemEditStarted = useCallback(
    (handler: (payload: ItemEditStartedPayload) => void) =>
      onNotification((notification) => {
        if (notification.eventType !== 'item:edit_started') return;
        const payload = notification.payload as ItemEditStartedPayload;
        if (!payload || typeof payload.itemId !== 'number') return;
        handler(payload);
      }),
    [onNotification],
  );

  /**
   * アイテム編集終了イベント購読
   */
  const onItemEditEnded = useCallback(
    (handler: (payload: ItemEditEndedPayload) => void) =>
      onNotification((notification) => {
        if (notification.eventType !== 'item:edit_ended') return;
        const payload = notification.payload as ItemEditEndedPayload;
        if (!payload || typeof payload.itemId !== 'number') return;
        handler(payload);
      }),
    [onNotification],
  );

  /**
   * ワークスペース編集開始
   */
  const startWorkspaceEdit = useCallback(async (workspaceId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot start workspace edit: not connected');
      return;
    }

    if (workspaceId <= 0) {
      console.warn('[SignalR] Invalid workspaceId for startWorkspaceEdit');
      return;
    }

    try {
      await connection.invoke('StartWorkspaceEdit', workspaceId);
    } catch (error) {
      console.error('[SignalR] Failed to start workspace edit:', error);
    }
  }, []);

  /**
   * ワークスペース編集終了
   */
  const endWorkspaceEdit = useCallback(async (workspaceId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    if (workspaceId <= 0) {
      return;
    }

    try {
      await connection.invoke('EndWorkspaceEdit', workspaceId);
    } catch (error) {
      console.error('[SignalR] Failed to end workspace edit:', error);
    }
  }, []);

  /**
   * ワークスペース編集状態取得
   */
  const getWorkspaceEditStatus = useCallback(async (workspaceId: number): Promise<WorkspaceEditStatus> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return { isEditing: false };
    }

    if (workspaceId <= 0) {
      return { isEditing: false };
    }

    try {
      const status = await connection.invoke<WorkspaceEditStatus>('GetWorkspaceEditStatus', workspaceId);
      if (!status) return { isEditing: false };
      return status;
    } catch (error) {
      console.error('[SignalR] Failed to get workspace edit status:', error);
      return { isEditing: false };
    }
  }, []);

  /**
   * アイテムページへのメンバー召集をリクエスト
   */
  const requestItemGather = useCallback(async (workspaceId: number, itemId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot request item gather: not connected');
      throw new Error('SignalR接続が確立されていません');
    }

    try {
      await connection.invoke('RequestItemGather', workspaceId, itemId);
      console.log(`[SignalR] Requested item gather: workspace=${workspaceId}, item=${itemId}`);
    } catch (error) {
      console.error('[SignalR] Failed to request item gather:', error);
      throw error;
    }
  }, []);

  /**
   * ワークスペース編集開始イベント購読
   */
  const onWorkspaceEditStarted = useCallback(
    (handler: (payload: WorkspaceEditStartedPayload) => void) =>
      onNotification((notification) => {
        if (notification.eventType !== 'workspace:edit_started') return;
        const payload = notification.payload as WorkspaceEditStartedPayload;
        if (!payload || typeof payload.workspaceId !== 'number') return;
        handler(payload);
      }),
    [onNotification],
  );

  /**
   * ワークスペース編集終了イベント購読
   */
  const onWorkspaceEditEnded = useCallback(
    (handler: (payload: WorkspaceEditEndedPayload) => void) =>
      onNotification((notification) => {
        if (notification.eventType !== 'workspace:edit_ended') return;
        const payload = notification.payload as WorkspaceEditEndedPayload;
        if (!payload || typeof payload.workspaceId !== 'number') return;
        handler(payload);
      }),
    [onNotification],
  );

  /**
   * タスク編集開始
   */
  const startTaskEdit = useCallback(async (taskId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      console.warn('[SignalR] Cannot start task edit: not connected');
      throw new Error('Not connected');
    }

    if (taskId <= 0) {
      console.warn('[SignalR] Invalid taskId for startTaskEdit');
      throw new Error('Invalid taskId');
    }

    // invokeのエラーはそのまま呼び出し元にスロー
    await connection.invoke('StartTaskEdit', taskId);
  }, []);

  /**
   * タスク編集終了
   */
  const endTaskEdit = useCallback(async (taskId: number) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return;
    }

    if (taskId <= 0) {
      return;
    }

    try {
      await connection.invoke('EndTaskEdit', taskId);
    } catch (error) {
      console.error('[SignalR] Failed to end task edit:', error);
    }
  }, []);

  /**
   * タスク編集状態取得
   */
  const getTaskEditStatus = useCallback(async (taskId: number): Promise<TaskEditStatus> => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      return { isEditing: false };
    }

    if (taskId <= 0) {
      return { isEditing: false };
    }

    try {
      const status = await connection.invoke<TaskEditStatus>('GetTaskEditStatus', taskId);
      if (!status) return { isEditing: false };
      return status;
    } catch (error) {
      console.error('[SignalR] Failed to get task edit status:', error);
      return { isEditing: false };
    }
  }, []);

  /**
   * タスク編集開始イベント購読
   */
  const onTaskEditStarted = useCallback(
    (handler: (payload: TaskEditStartedPayload) => void) =>
      onNotification((notification) => {
        if (notification.eventType !== 'task:edit_started') return;
        const payload = notification.payload as TaskEditStartedPayload;
        if (!payload || typeof payload.taskId !== 'number') return;
        handler(payload);
      }),
    [onNotification],
  );

  /**
   * タスク編集終了イベント購読
   */
  const onTaskEditEnded = useCallback(
    (handler: (payload: TaskEditEndedPayload) => void) =>
      onNotification((notification) => {
        if (notification.eventType !== 'task:edit_ended') return;
        const payload = notification.payload as TaskEditEndedPayload;
        if (!payload || typeof payload.taskId !== 'number') return;
        handler(payload);
      }),
    [onNotification],
  );

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
    joinTask,
    leaveTask,
    joinChat,
    leaveChat,
    sendChatTyping,
    onNotification,
    startItemEdit,
    endItemEdit,
    getItemEditStatus,
    onItemEditStarted,
    onItemEditEnded,
    startWorkspaceEdit,
    endWorkspaceEdit,
    getWorkspaceEditStatus,
    onWorkspaceEditStarted,
    onWorkspaceEditEnded,
    startTaskEdit,
    endTaskEdit,
    getTaskEditStatus,
    onTaskEditStarted,
    onTaskEditEnded,
    requestItemGather,
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
