import type { LoginResponse, RoleInfoResponse } from '@/connectors/hey-api-axios/types.gen';
import { type CreateSessionInput, ServerSessionManager } from '@/libs/serverSession';

/**
 * ログイン時にクライアントから受け取るデバイス情報
 */
export interface LoginDeviceContext {
  deviceName?: string;
  deviceType?: string | null;
  os?: string | null;
  userAgent?: string;
  appVersion?: string;
  timezone?: string;
  location?: string;
  ipAddress?: string;
}

/**
 * ログインレスポンスから Redis セッションを確立する
 *
 * パスワード認証とパスキー認証で共通利用する。
 * Cookie には sessionId のみを保存し、トークンは Redis に保持する。
 */
export async function createLoginSession(response: LoginResponse, device: LoginDeviceContext): Promise<void> {
  const accessToken = response.accessToken;
  const refreshToken = response.refreshToken || '';

  if (!accessToken) {
    throw new Error('Invalid response from server');
  }

  const sessionInput: CreateSessionInput = {
    accessToken,
    refreshToken,
    accessExpiresAt: response.expiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    refreshExpiresAt: response.refreshExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: response.userId || 0,
      name: response.username || '',
      email: response.email || '',
      roles: response.roles ? response.roles.map((role: RoleInfoResponse) => role.name || '') : [],
    },
    device: {
      publicId: response.device?.publicId ?? undefined,
      name: device.deviceName,
      type: device.deviceType ?? undefined,
      os: device.os ?? undefined,
      userAgent: device.userAgent,
      appVersion: device.appVersion,
      timezone: device.timezone,
      location: device.location,
      ipAddress: device.ipAddress,
    },
  };

  await ServerSessionManager.createSession(sessionInput);
}
