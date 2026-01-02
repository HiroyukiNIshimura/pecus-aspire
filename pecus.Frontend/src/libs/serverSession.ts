/**
 * サーバーサイドセッション管理
 *
 * Redis ベースのセッションストア。
 * Cookie には opaque な sessionId のみを保存し、
 * トークンやユーザー情報はすべて Redis に保持する。
 *
 * @see docs/auth-architecture-redesign.md
 */

import { cookies } from 'next/headers';
import { getApiBaseUrl } from './env';
import { getRedisClient } from './redis';

// ========================================
// 型定義
// ========================================

/**
 * Redis に保存するセッションデータ
 */
export interface ServerSessionData {
  /** セッション識別子 */
  sessionId: string;

  /** JWT アクセストークン（ブラウザには送らない） */
  accessToken: string;

  /** リフレッシュトークン（ブラウザには送らない） */
  refreshToken: string;

  /** アクセストークンの有効期限（ISO 8601） */
  accessExpiresAt: string;

  /** リフレッシュトークンの有効期限（ISO 8601） */
  refreshExpiresAt: string;

  /** ユーザー情報 */
  user: {
    id: number;
    name: string;
    email: string;
    roles: string[];
  };

  /** デバイス情報 */
  device?: {
    /** デバイスの公開ID（バックエンドの Device.PublicId と紐づけ） */
    publicId?: string;
    name?: string;
    type?: string;
    os?: string;
    userAgent?: string;
    appVersion?: string;
    timezone?: string;
    location?: string;
    ipAddress?: string;
  };

  /** セッション作成日時（ISO 8601） */
  createdAt: string;

  /** 最終アクセス日時（ISO 8601） */
  lastAccessedAt: string;
}

/**
 * セッション作成時の入力データ
 */
export interface CreateSessionInput {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
  user: ServerSessionData['user'];
  device?: ServerSessionData['device'];
}

// ========================================
// 定数
// ========================================

/** Cookie に保存するセッション ID のキー名 */
const SESSION_COOKIE_KEY = 'sessionId';

/** Redis キーのプレフィックス */
const SESSION_KEY_PREFIX = 'frontend:session:';

/** セッションのデフォルト TTL（30 日 = 2592000 秒） */
const SESSION_DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;

/** 非アクティブセッションの TTL（7 日 = 604800 秒） */
const SESSION_INACTIVE_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * リフレッシュ中の Promise をキャッシュする Map
 * 同一セッションに対する並行リフレッシュを防止するために使用
 */
const refreshPromiseMap = new Map<string, Promise<ServerSessionData | null>>();

// ========================================
// ユーティリティ関数
// ========================================

/**
 * 暗号学的に安全なセッション ID を生成
 */
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Redis キーを生成
 */
function getSessionKey(sessionId: string): string {
  return `${SESSION_KEY_PREFIX}${sessionId}`;
}

/**
 * ISO 8601 文字列から TTL（秒）を計算
 * 有効期限が過去の場合や無効な場合はデフォルト TTL を返す
 */
function calculateTtlFromExpiry(expiresAt: string, defaultTtl: number = SESSION_DEFAULT_TTL_SECONDS): number {
  const expiresMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresMs)) {
    return defaultTtl;
  }
  const ttlSeconds = Math.floor((expiresMs - Date.now()) / 1000);
  return ttlSeconds > 0 ? ttlSeconds : defaultTtl;
}

// ========================================
// ServerSessionManager クラス
// ========================================

/**
 * サーバーサイドセッションマネージャー
 *
 * Next.js の Server Components / Server Actions / Route Handlers から使用。
 * セッションデータは Redis に保存し、Cookie には sessionId のみを保存する。
 */
export class ServerSessionManager {
  /**
   * Cookie からセッション ID を取得し、Redis からセッションデータを取得
   *
   * @returns セッションデータ、または null（未ログイン/期限切れ）
   */
  static async getSession(): Promise<ServerSessionData | null> {
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;

      if (!sessionId) {
        return null;
      }

      const redis = getRedisClient();
      const sessionKey = getSessionKey(sessionId);
      const sessionJson = await redis.get(sessionKey);

      if (!sessionJson) {
        // Redis にセッションがない（期限切れ or 削除済み）
        // Cookie も削除しておく
        await ServerSessionManager.clearSessionCookie();
        return null;
      }

      const session: ServerSessionData = JSON.parse(sessionJson);

      // lastAccessedAt を更新（スライディングセッション）
      session.lastAccessedAt = new Date().toISOString();
      await redis.setex(sessionKey, SESSION_INACTIVE_TTL_SECONDS, JSON.stringify(session));

      return session;
    } catch (error) {
      console.error('[ServerSession] Failed to get session:', error);
      return null;
    }
  }

  /**
   * 新しいセッションを作成し、Redis に保存、Cookie にセッション ID を設定
   *
   * @param input セッション作成に必要なデータ
   * @returns 作成されたセッションデータ
   */
  static async createSession(input: CreateSessionInput): Promise<ServerSessionData> {
    const sessionId = generateSessionId();
    const now = new Date().toISOString();

    const session: ServerSessionData = {
      sessionId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      accessExpiresAt: input.accessExpiresAt,
      refreshExpiresAt: input.refreshExpiresAt,
      user: input.user,
      device: input.device,
      createdAt: now,
      lastAccessedAt: now,
    };

    // TTL はリフレッシュトークンの有効期限に合わせる（最大 30 日）
    const ttl = Math.min(calculateTtlFromExpiry(input.refreshExpiresAt), SESSION_DEFAULT_TTL_SECONDS);

    const redis = getRedisClient();
    const sessionKey = getSessionKey(sessionId);
    await redis.setex(sessionKey, ttl, JSON.stringify(session));

    // Cookie にセッション ID のみ保存（httpOnly: true）
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_KEY, sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ttl,
    });

    console.log(`[ServerSession] Session created: ${sessionId.substring(0, 8)}...`);
    return session;
  }

  /**
   * 既存セッションのトークンを更新（リフレッシュ後に呼び出し）
   *
   * @param sessionId セッション ID
   * @param newTokens 新しいトークン情報
   */
  static async updateTokens(
    sessionId: string,
    newTokens: {
      accessToken: string;
      refreshToken: string;
      accessExpiresAt: string;
      refreshExpiresAt: string;
    },
  ): Promise<ServerSessionData | null> {
    try {
      const redis = getRedisClient();
      const sessionKey = getSessionKey(sessionId);
      const sessionJson = await redis.get(sessionKey);

      if (!sessionJson) {
        return null;
      }

      const session: ServerSessionData = JSON.parse(sessionJson);

      // トークン情報を更新
      session.accessToken = newTokens.accessToken;
      session.refreshToken = newTokens.refreshToken;
      session.accessExpiresAt = newTokens.accessExpiresAt;
      session.refreshExpiresAt = newTokens.refreshExpiresAt;
      session.lastAccessedAt = new Date().toISOString();

      // TTL も更新
      const ttl = Math.min(calculateTtlFromExpiry(newTokens.refreshExpiresAt), SESSION_DEFAULT_TTL_SECONDS);

      await redis.setex(sessionKey, ttl, JSON.stringify(session));

      console.log(`[ServerSession] Tokens updated for session: ${sessionId.substring(0, 8)}...`);
      return session;
    } catch (error) {
      console.error('[ServerSession] Failed to update tokens:', error);
      return null;
    }
  }

  /**
   * セッションのデバイスPublicIdを更新
   * Deviceテーブルが初期化された後などに、バックエンドで再マッチングしたPublicIdで更新する
   *
   * @param newPublicId 新しいデバイスPublicId
   */
  static async updateDevicePublicId(newPublicId: string): Promise<void> {
    try {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;

      if (!sessionId) {
        console.warn('[ServerSession] No session found to update device publicId');
        return;
      }

      const redis = getRedisClient();
      const sessionKey = getSessionKey(sessionId);
      const sessionJson = await redis.get(sessionKey);

      if (!sessionJson) {
        console.warn('[ServerSession] Session not found in Redis');
        return;
      }

      const session: ServerSessionData = JSON.parse(sessionJson);

      if (!session.device) {
        session.device = {};
      }
      session.device.publicId = newPublicId;
      session.lastAccessedAt = new Date().toISOString();

      const ttl = await redis.ttl(sessionKey);
      if (ttl > 0) {
        await redis.setex(sessionKey, ttl, JSON.stringify(session));
      } else {
        await redis.setex(sessionKey, SESSION_DEFAULT_TTL_SECONDS, JSON.stringify(session));
      }

      console.log(`[ServerSession] Device publicId updated to: ${newPublicId}`);
    } catch (error) {
      console.error('[ServerSession] Failed to update device publicId:', error);
    }
  }

  /**
   * セッションを削除（ログアウト時）
   *
   * @param sessionId セッション ID（省略時は Cookie から取得）
   */
  static async destroySession(sessionId?: string): Promise<void> {
    try {
      // セッション ID を取得
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const cookieStore = await cookies();
        targetSessionId = cookieStore.get(SESSION_COOKIE_KEY)?.value;
      }

      if (targetSessionId) {
        // Redis からセッションを削除
        const redis = getRedisClient();
        const sessionKey = getSessionKey(targetSessionId);
        await redis.del(sessionKey);
        console.log(`[ServerSession] Session destroyed: ${targetSessionId.substring(0, 8)}...`);
      }

      // Cookie を削除
      await ServerSessionManager.clearSessionCookie();
    } catch (error) {
      console.error('[ServerSession] Failed to destroy session:', error);
      throw error;
    }
  }

  /**
   * 特定デバイスの publicId に紐づくセッションを検索して削除
   *
   * @param devicePublicId バックエンドの Device.PublicId
   * @returns 削除したセッション数
   */
  static async destroySessionsByDevicePublicId(devicePublicId: string): Promise<number> {
    try {
      const redis = getRedisClient();
      const pattern = `${SESSION_KEY_PREFIX}*`;
      const keys = await redis.keys(pattern);

      let deletedCount = 0;
      for (const key of keys) {
        const sessionJson = await redis.get(key);
        if (!sessionJson) continue;

        try {
          const session: ServerSessionData = JSON.parse(sessionJson);
          // デバイスの publicId と照合
          if (session.device?.publicId === devicePublicId) {
            await redis.del(key);
            deletedCount++;
            console.log(`[ServerSession] Destroyed session for device: ${devicePublicId}`);
          }
        } catch {
          // パース失敗は無視
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('[ServerSession] Failed to destroy sessions by device:', error);
      return 0;
    }
  }

  /**
   * 現在のユーザーの全セッションを削除（自分のセッションを除く）
   *
   * @param currentSessionId 維持するセッション ID（現在のセッション）
   * @param userId ユーザー ID
   * @returns 削除したセッション数
   */
  static async destroyOtherSessions(currentSessionId: string, userId: number): Promise<number> {
    try {
      const redis = getRedisClient();
      const pattern = `${SESSION_KEY_PREFIX}*`;
      const keys = await redis.keys(pattern);

      let deletedCount = 0;
      for (const key of keys) {
        const sessionJson = await redis.get(key);
        if (!sessionJson) continue;

        try {
          const session: ServerSessionData = JSON.parse(sessionJson);
          // 同じユーザーで、かつ現在のセッション以外を削除
          if (session.user.id === userId && session.sessionId !== currentSessionId) {
            await redis.del(key);
            deletedCount++;
          }
        } catch {
          // パース失敗は無視
        }
      }

      console.log(`[ServerSession] Destroyed ${deletedCount} other sessions for user: ${userId}`);
      return deletedCount;
    } catch (error) {
      console.error('[ServerSession] Failed to destroy other sessions:', error);
      return 0;
    }
  }

  /**
   * アクセストークンを取得
   *
   * @returns アクセストークン、または null
   */
  static async getAccessToken(): Promise<string | null> {
    const session = await ServerSessionManager.getSession();
    return session?.accessToken ?? null;
  }

  /**
   * リフレッシュトークンを取得
   *
   * @returns リフレッシュトークン、または null
   */
  static async getRefreshToken(): Promise<string | null> {
    const session = await ServerSessionManager.getSession();
    return session?.refreshToken ?? null;
  }

  /**
   * ユーザー情報を取得
   *
   * @returns ユーザー情報、または null
   */
  static async getUser(): Promise<ServerSessionData['user'] | null> {
    const session = await ServerSessionManager.getSession();
    return session?.user ?? null;
  }

  /**
   * セッション ID を取得（Cookie から）
   *
   * @returns セッション ID、または null
   */
  static async getSessionId(): Promise<string | null> {
    try {
      const cookieStore = await cookies();
      return cookieStore.get(SESSION_COOKIE_KEY)?.value ?? null;
    } catch {
      return null;
    }
  }

  /**
   * アクセストークンの有効期限をチェック
   *
   * @param bufferSeconds 期限前のバッファ秒数（デフォルト 60 秒）
   * @returns true = 有効期限内、false = 期限切れ/期限切れ間近
   */
  static async isAccessTokenValid(bufferSeconds: number = 60): Promise<boolean> {
    const session = await ServerSessionManager.getSession();
    if (!session?.accessExpiresAt) {
      return false;
    }

    const expiresAt = Date.parse(session.accessExpiresAt);
    if (Number.isNaN(expiresAt)) {
      return false;
    }

    const now = Date.now();
    const bufferMs = bufferSeconds * 1000;
    return expiresAt - now > bufferMs;
  }

  /**
   * 有効なアクセストークンを取得（必要に応じてリフレッシュ）
   *
   * アクセストークンの有効期限が5分未満の場合、自動的にリフレッシュを試行する。
   * リフレッシュに成功した場合は新しいアクセストークンを返す。
   * リフレッシュに失敗した場合は null を返す（再ログインが必要）。
   *
   * @returns 有効なアクセストークン、または null
   */
  static async getValidAccessToken(): Promise<string | null> {
    const session = await ServerSessionManager.getSession();
    if (!session) {
      return null;
    }

    // アクセストークンの有効期限をチェック（5分のバッファ）
    const expiresAt = Date.parse(session.accessExpiresAt);
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5分

    if (!Number.isNaN(expiresAt) && expiresAt - now > bufferMs) {
      // まだ有効期限に余裕がある
      return session.accessToken;
    }

    // リフレッシュが必要
    console.log('[ServerSession] Access token expiring soon, attempting refresh...');
    const refreshedSession = await ServerSessionManager.refreshTokens();
    return refreshedSession?.accessToken ?? null;
  }

  /**
   * トークンをリフレッシュ（並行制御付き）
   *
   * 同一セッションに対する並行リフレッシュを防止するため、
   * 既にリフレッシュが進行中の場合はその Promise を再利用する。
   * これにより、React 19.2 の並行レンダリングでの競合状態を防ぐ。
   *
   * @returns 更新されたセッション、または null（リフレッシュ失敗時）
   */
  static async refreshTokens(): Promise<ServerSessionData | null> {
    try {
      // まずセッション ID を取得（ロックキーとして使用）
      const sessionId = await ServerSessionManager.getSessionId();
      if (!sessionId) {
        console.error('[ServerSession] No session found for refresh');
        return null;
      }

      // 既にこのセッションのリフレッシュが進行中か確認
      const existingPromise = refreshPromiseMap.get(sessionId);
      if (existingPromise) {
        console.log('[ServerSession] Refresh already in progress, waiting...');
        return existingPromise;
      }

      // 新しいリフレッシュ Promise を作成してキャッシュ
      const refreshPromise = ServerSessionManager.doRefreshTokens(sessionId);
      refreshPromiseMap.set(sessionId, refreshPromise);

      try {
        return await refreshPromise;
      } finally {
        // 完了後にキャッシュから削除
        refreshPromiseMap.delete(sessionId);
      }
    } catch (error) {
      console.error('[ServerSession] Refresh error:', error);
      return null;
    }
  }

  /**
   * 実際のトークンリフレッシュ処理（内部用）
   *
   * @param sessionId セッション ID
   * @returns 更新されたセッション、または null
   */
  private static async doRefreshTokens(sessionId: string): Promise<ServerSessionData | null> {
    try {
      const redis = getRedisClient();
      const sessionKey = getSessionKey(sessionId);
      const sessionJson = await redis.get(sessionKey);

      if (!sessionJson) {
        console.error('[ServerSession] Session not found in Redis for refresh');
        return null;
      }

      const session: ServerSessionData = JSON.parse(sessionJson);

      const apiBaseUrl = getApiBaseUrl();

      const body = {
        refreshToken: session.refreshToken,
        deviceName: session.device?.name,
        deviceType: session.device?.type,
        os: session.device?.os,
        userAgent: session.device?.userAgent,
        appVersion: session.device?.appVersion,
        timezone: session.device?.timezone,
        location: session.device?.location,
        ipAddress: session.device?.ipAddress,
      };

      const refreshResponse = await fetch(`${apiBaseUrl}/api/entrance/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!refreshResponse.ok) {
        console.error('[ServerSession] Refresh API failed:', refreshResponse.status);
        // リフレッシュ失敗時はセッションを破棄
        await ServerSessionManager.destroySession(session.sessionId);
        return null;
      }

      const data = await refreshResponse.json();
      console.log('[ServerSession] Token refreshed successfully');

      // セッションを更新
      const updatedSession = await ServerSessionManager.updateTokens(session.sessionId, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessExpiresAt: data.expiresAt,
        refreshExpiresAt: data.refreshExpiresAt,
      });

      return updatedSession;
    } catch (error) {
      console.error('[ServerSession] Refresh error:', error);
      return null;
    }
  }

  /**
   * Cookie からセッション ID を削除（内部用）
   */
  private static async clearSessionCookie(): Promise<void> {
    try {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE_KEY);
    } catch (error) {
      console.error('[ServerSession] Failed to clear session cookie:', error);
    }
  }
}
