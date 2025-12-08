import { NextResponse } from 'next/server';
import { parseRouterError, unauthorizedError } from '@/app/api/routerError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { SessionManager } from '@/libs/session';

export async function GET() {
  try {
    const refreshToken = await SessionManager.getRefreshToken();
    if (!refreshToken) {
      return unauthorizedError('リフレッシュトークンが見つかりません。再度ログインしてください。');
    }

    const api = createPecusApiClients();
    const devices = await api.profile.getApiProfileDevices(refreshToken);
    return NextResponse.json(devices);
  } catch (error) {
    console.error('Failed to fetch profile devices:', error);
    return parseRouterError(error, '接続端末の取得に失敗しました');
  }
}
