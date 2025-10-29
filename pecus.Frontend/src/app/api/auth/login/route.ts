import { NextRequest, NextResponse } from 'next/server';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { SessionManager } from '@/libs/session';

export async function POST(request: NextRequest) {
  try {
    const { loginIdentifier, password } = await request.json();

    const client = createPecusApiClients();
    const res = await client.entranceAuth.apiEntranceAuthLoginPost({
      loginRequest: {
        loginIdentifier,
        password,
      },
    });

    // APIレスポンスからトークンを取得
    const accessToken = res.data.accessToken;
    const refreshToken = res.data.refreshToken || '';

    if (!accessToken) {
      return NextResponse.json({ error: 'Invalid response' }, { status: 400 });
    }

    const sessionData = {
      accessToken,
      refreshToken,
      user: {
        id: res.data.userId || 0,
        name: res.data.username,
        email: res.data.email,
        roles: res.data.roles || [],
      },
    };

    await SessionManager.setSession(sessionData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Login failed' },
      { status: 401 }
    );
  }
}