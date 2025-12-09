import { NextResponse } from 'next/server';
import { parseRouterError, unauthorizedError } from '@/app/api/routerError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { ServerSessionManager } from '@/libs/serverSession';

export async function GET() {
  try {
    const session = await ServerSessionManager.getSession();
    if (!session) {
      return unauthorizedError('セッションが見つかりません。再度ログインしてください。');
    }

    const api = createPecusApiClients();
    const devices = await api.profile.getApiProfileDevices();

    // 現在のデバイスの publicId を含めてレスポンス
    return NextResponse.json({
      devices,
      currentDevicePublicId: session.device?.publicId ?? null,
    });
  } catch (error) {
    console.error('Failed to fetch profile devices:', error);
    return parseRouterError(error, '接続端末の取得に失敗しました');
  }
}
