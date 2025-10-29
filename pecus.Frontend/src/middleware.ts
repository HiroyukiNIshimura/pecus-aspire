import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/libs/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公開ルート
  if (pathname.startsWith('/signin') || pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/refresh')) {
    return NextResponse.next();
  }

  // APIルート以外は認証チェック
  if (!pathname.startsWith('/api/')) {
    const session = await SessionManager.getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
};
