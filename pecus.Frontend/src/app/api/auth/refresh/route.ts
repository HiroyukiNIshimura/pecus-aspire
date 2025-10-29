import { NextRequest, NextResponse } from 'next/server';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { SessionManager } from '@/libs/session';

export async function POST(request: NextRequest) {
  try {
    console.log('API Route: Starting token refresh');

    // リフレッシュトークンをセッションから取得
    const session = await SessionManager.getSession();
    if (!session?.refreshToken) {
      console.log('API Route: No refresh token in session');
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const refreshToken = session.refreshToken;
    console.log('API Route: Got refresh token, calling WebAPI refresh endpoint');

    // createPecusApiClients() を使用してプロジェクトルールに従う
    const clients = createPecusApiClients();
    const response = await clients.refresh.apiEntranceRefreshPost({
      refreshRequest: { refreshToken }
    });

    console.log('API Route: Refresh API call successful');

    // レスポンスから新しいトークンを取得
    const newAccessToken = response.data?.accessToken;
    const newRefreshToken = response.data?.refreshToken;

    if (!newAccessToken) {
      throw new Error('No access token in refresh response');
    }

    // SessionManagerでトークンを更新（API Routeなのでクッキー変更可能）
    await SessionManager.setSession({
      ...session,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken || session.refreshToken,
    });

    console.log('API Route: Tokens updated in session');
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Route: Refresh failed with error:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}