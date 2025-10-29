import { NextResponse } from 'next/server';
import { SessionManager } from '@/libs/session';

export async function GET() {
  try {
    const session = await SessionManager.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    const isAdmin = user.roles?.some((role: any) =>
      typeof role === 'string' ? role === 'Admin' : role.name === 'Admin'
    ) ?? false;

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        isAdmin
      }
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}