import { NextResponse } from 'next/server';
import { parseRouterError } from '@/app/api/routerError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';

export async function GET() {
  try {
    const api = createPecusApiClients();
    const devices = await api.profile.getApiProfileDevices();
    return NextResponse.json(devices);
  } catch (error) {
    console.error('Failed to fetch profile devices:', error);
    return parseRouterError(error, '接続端末の取得に失敗しました');
  }
}
