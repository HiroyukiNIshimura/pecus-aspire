import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

/**
 * Next.js Middleware
 *
 * 全ページアクセス時にトークンの有効性をチェックし、
 * 期限切れの場合は自動的にリフレッシュを試行します。
 *
 * 実行タイミング：
 * - サーバーコンポーネントのレンダリング前
 * - クライアントサイドのナビゲーション時
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証不要なパス（公開ページ）
  const publicPaths = ['/signin', '/signup', '/forgot-password', '/reset-password'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 静的リソース・API Routesはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // クッキーからトークンを取得
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // トークンが存在しない場合はログインページへ
  if (!accessToken || !refreshToken) {
    console.log('[Middleware] No tokens found, redirecting to signin');
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  try {
    // アクセストークンの有効期限をチェック
    const decoded: any = jwtDecode(accessToken);
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;

    // 有効期限が5分以上残っている場合はそのまま通過
    if (expiresIn > 300) {
      console.log(`[Middleware] Access token valid for ${expiresIn}s, allowing access`);
      return NextResponse.next();
    }

    // 有効期限が5分未満の場合はリフレッシュを試行
    console.log(`[Middleware] Access token expiring in ${expiresIn}s, attempting refresh`);

    const apiBaseUrl = process.env.API_BASE_URL || 'https://localhost:7265';
    const refreshResponse = await fetch(`${apiBaseUrl}/api/entrance/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      console.error('[Middleware] Refresh failed:', refreshResponse.status);

      // リフレッシュトークンも無効な場合はクッキーをクリアしてログインページへ
      const response = NextResponse.redirect(new URL('/signin', request.url));
      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      response.cookies.delete('user');
      return response;
    }

    const data = await refreshResponse.json();
    console.log('[Middleware] Token refreshed successfully');

    // 新しいトークンをクッキーに設定してリクエストを続行
    const response = NextResponse.next();
    response.cookies.set('accessToken', data.accessToken, {
      path: '/',
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    response.cookies.set('refreshToken', data.refreshToken, {
      path: '/',
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('[Middleware] Token validation error:', error);

    // トークンのデコードに失敗した場合はクッキーをクリア
    const response = NextResponse.redirect(new URL('/signin', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('user');
    return response;
  }
}

// Middleware を適用するパスを指定
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
