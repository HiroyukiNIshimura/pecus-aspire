import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseRouterError, unauthorizedError } from '@/app/api/routerError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { DeviceResponse } from '@/connectors/api/pecus';
import { getApiBaseUrl } from '@/libs/env';
import { ServerSessionManager } from '@/libs/serverSession';

interface DeviceListResponse {
  devices: DeviceResponse[];
  currentDevicePublicId: string | null;
}

export async function GET() {
  try {
    const session = await ServerSessionManager.getSession();
    if (!session) {
      return unauthorizedError('セッションが見つかりません。再度ログインしてください。');
    }

    const api = createPecusApiClients();
    const devices = await api.profile.getApiProfileDevices();

    let currentDevicePublicId = session.device?.publicId ?? null;

    const sessionPublicIdExists = currentDevicePublicId && devices.some((d) => d.publicId === currentDevicePublicId);

    if (!sessionPublicIdExists && session.device) {
      const headersList = await headers();
      const deviceType = session.device.type ?? 'Browser';
      const os = session.device.os ?? 'Unknown';
      const userAgent = session.device.userAgent;
      const clientIp =
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        headersList.get('cf-connecting-ip') ||
        session.device.ipAddress ||
        undefined;

      try {
        const accessToken = await ServerSessionManager.getValidAccessToken();
        if (accessToken) {
          const apiBaseUrl = getApiBaseUrl();
          const params = new URLSearchParams();
          params.set('deviceType', deviceType);
          params.set('os', os);
          if (userAgent) params.set('userAgent', userAgent);

          const response = await fetch(`${apiBaseUrl}/api/profile/devices/with-current?${params.toString()}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Forwarded-For': clientIp ?? '',
            },
          });

          if (response.ok) {
            const data = (await response.json()) as DeviceListResponse;
            if (data.currentDevicePublicId) {
              currentDevicePublicId = data.currentDevicePublicId;
              await ServerSessionManager.updateDevicePublicId(data.currentDevicePublicId);
              console.log(`[devices/route] Updated session device publicId to: ${data.currentDevicePublicId}`);
            }
          }
        }
      } catch (matchError) {
        console.warn('[devices/route] Failed to re-match device:', matchError);
      }
    }

    return NextResponse.json({
      devices,
      currentDevicePublicId,
    });
  } catch (error) {
    console.error('Failed to fetch profile devices:', error);
    return parseRouterError(error, '接続端末の取得に失敗しました');
  }
}
