/**
 * セッション管理モジュール（互換レイヤー）
 *
 * 新しい ServerSessionManager への移行期間中の互換性を維持するためのラッパー。
 * 新規コードは直接 ServerSessionManager を使用してください。
 *
 * @deprecated 新規コードは ServerSessionManager を直接使用してください
 * @see src/libs/serverSession.ts
 * @see docs/auth-architecture-redesign.md
 */

import { type CreateSessionInput, type ServerSessionData, ServerSessionManager } from './serverSession';

/**
 * セッションデータ型（互換性のためのエイリアス）
 *
 * @deprecated 新規コードは ServerSessionData を使用してください
 */
export type SessionData = {
  accessToken: string;
  refreshToken: string;
  /** アクセストークンの有効期限（ISO文字列）。クッキー寿命計算に利用 */
  accessExpiresAt?: string;
  /** リフレッシュトークンの有効期限（ISO文字列）。クッキー寿命計算に利用 */
  refreshExpiresAt?: string;
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };
  device?: {
    name?: string;
    type?: string;
    os?: string;
    userAgent?: string;
    appVersion?: string;
    timezone?: string;
    location?: string;
    ipAddress?: string;
  };
};

/**
 * SessionData を CreateSessionInput に変換
 */
function toCreateSessionInput(data: SessionData): CreateSessionInput {
  const now = new Date();
  // デフォルト有効期限: accessToken = 1時間後、refreshToken = 30日後
  const defaultAccessExpiry = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
  const defaultRefreshExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accessExpiresAt: data.accessExpiresAt || defaultAccessExpiry,
    refreshExpiresAt: data.refreshExpiresAt || defaultRefreshExpiry,
    user: data.user,
    device: data.device,
  };
}

/**
 * ServerSessionData を SessionData に変換（互換性のため）
 */
function toSessionData(serverSession: ServerSessionData): SessionData {
  return {
    accessToken: serverSession.accessToken,
    refreshToken: serverSession.refreshToken,
    accessExpiresAt: serverSession.accessExpiresAt,
    refreshExpiresAt: serverSession.refreshExpiresAt,
    user: serverSession.user,
    device: serverSession.device,
  };
}

/**
 * セッションマネージャー（互換レイヤー）
 *
 * 内部で ServerSessionManager に委譲します。
 * Cookie には sessionId のみ保存し、トークンは Redis に保持します。
 *
 * @deprecated 新規コードは ServerSessionManager を直接使用してください
 */
export class SessionManager {
  /**
   * セッション取得（SSR専用）
   *
   * @deprecated ServerSessionManager.getSession() を使用してください
   */
  static async getSession(): Promise<SessionData | null> {
    const serverSession = await ServerSessionManager.getSession();
    if (!serverSession) {
      return null;
    }
    return toSessionData(serverSession);
  }

  /**
   * セッション保存（Route Handler / Server Action 専用）
   *
   * @deprecated ServerSessionManager.createSession() を使用してください
   */
  static async setSession(data: SessionData): Promise<void> {
    const input = toCreateSessionInput(data);
    await ServerSessionManager.createSession(input);
  }

  /**
   * セッションクリア（Route Handler / Server Action 専用）
   *
   * @deprecated ServerSessionManager.destroySession() を使用してください
   */
  static async clearSession(): Promise<void> {
    await ServerSessionManager.destroySession();
  }

  /**
   * アクセストークン取得（SSR専用）
   *
   * @deprecated ServerSessionManager.getAccessToken() を使用してください
   */
  static async getAccessToken(): Promise<string | null> {
    return ServerSessionManager.getAccessToken();
  }

  /**
   * リフレッシュトークン取得（SSR専用）
   *
   * @deprecated ServerSessionManager.getRefreshToken() を使用してください
   */
  static async getRefreshToken(): Promise<string | null> {
    return ServerSessionManager.getRefreshToken();
  }
}
