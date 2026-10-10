'use server';

import { ServerSessionManager } from '@/libs/serverSession';

export async function getAccessToken(): Promise<string | null> {
  try {
    return await ServerSessionManager.getValidAccessToken();
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await ServerSessionManager.getRefreshToken();
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

export async function refreshAccessToken(): Promise<{ accessToken: string; persisted: boolean }> {
  console.log('[auth] Refreshing access token');

  try {
    const updatedSession = await ServerSessionManager.refreshTokens();

    if (!updatedSession) {
      throw new Error('Failed to refresh token - session destroyed');
    }

    console.log('[auth] Token refreshed successfully');
    return { accessToken: updatedSession.accessToken, persisted: true };
  } catch (error) {
    console.error('[auth] Failed to refresh access token:', error);
    throw error;
  }
}
