import { NextRequest, NextResponse } from 'next/server';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    const client = createPecusApiClients();
    const res = await client.refresh.apiEntranceRefreshPost({
      refreshRequest: {
        refreshToken,
      },
    });

    // RefreshResponse から新しいトークンを取得
    const newAccessToken = res.data.accessToken;
    const newRefreshToken = res.data.refreshToken;

    if (!newAccessToken) {
      return NextResponse.json({ error: 'Invalid response' }, { status: 400 });
    }

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Refresh failed' },
      { status: 401 }
    );
  }
}