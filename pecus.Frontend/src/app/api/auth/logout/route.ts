import { NextResponse } from 'next/server';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { SessionManager } from '@/libs/session';

export async function POST() {
  console.log('Logout API called');
  try {
    const session = await SessionManager.getSession();
    if (session?.refreshToken) {
      console.log('Calling WebAPI logout');
      const client = createPecusApiClients();
      await client.refresh.apiEntranceLogoutPost({
        refreshRequest: {
          refreshToken: session.refreshToken,
        },
      });
    }
  } catch (error) {
    console.error('Logout API error:', error);
    // エラーがあってもセッションはクリア
  }

  console.log('Clearing session');
  await SessionManager.clearSession();
  return NextResponse.json({ success: true });
}