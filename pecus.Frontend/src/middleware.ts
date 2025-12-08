/**
 * Next.js Middleware - セッション認証
 *
 * セキュリティ改善: Cookie には sessionId のみ保存し、
 * トークンは Redis に保持（ServerSessionManager 経由）。
 *
 * Edge Runtime の制限により、middleware では Redis に直接アクセスできないため、
 * sessionId の存在確認のみ行い、詳細なトークン検証は Server Components に委譲する。
 *
 * @see docs/auth-architecture-redesign.md
 * @see src/libs/serverSession.ts
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** sessionId Cookie のキー名（serverSession.ts と同期） */
const SESSION_COOKIE_KEY = 'sessionId';

/**
 * キャッシュ無効化ヘッダーを設定
 */
function setNoCacheHeaders(response: NextResponse): void {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
}

/**
 * セッション Cookie を削除してログインページへリダイレクト
 */
function redirectToSignIn(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL('/signin', request.url));
  setNoCacheHeaders(response);
  response.cookies.delete(SESSION_COOKIE_KEY);
  // 旧形式の Cookie も削除（移行期間中）
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');
  response.cookies.delete('user');
  response.cookies.delete('device');
  return response;
}

/**
 * Next.js Middleware
 *
 * 全ページアクセス時に sessionId の存在をチェック。
 * 詳細なトークン検証と自動リフレッシュは Server Components / API で行う。
 *
 * 実行タイミング：
 * - サーバーコンポーネントのレンダリング前
 * - クライアントサイドのナビゲーション時
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証不要なパス（公開ページ）
  const publicPaths = ['/signin', '/signup', '/forgot-password', '/password-reset', '/error-test'];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Cookie から sessionId を取得
  const sessionId = request.cookies.get(SESSION_COOKIE_KEY)?.value;

  // sessionId が存在しない場合はログインページへ
  if (!sessionId) {
    // 旧形式の Cookie が残っている場合も移行のためリダイレクト
    const hasLegacyCookies = request.cookies.get('accessToken')?.value || request.cookies.get('refreshToken')?.value;
    if (hasLegacyCookies) {
      console.log('[Middleware] Legacy cookies found, clearing and redirecting to signin');
    } else {
      console.log('[Middleware] No sessionId found, redirecting to signin');
    }
    return redirectToSignIn(request);
  }

  // sessionId が存在する場合はリクエストを続行
  // 詳細なセッション検証（Redis 参照、トークンリフレッシュ等）は
  // Server Components / Server Actions で ServerSessionManager を使用して行う
  console.log(`[Middleware] SessionId found: ${sessionId.substring(0, 8)}..., allowing access`);

  const response = NextResponse.next();
  // 保護されたページはキャッシュ無効化（セッション依存のため）
  setNoCacheHeaders(response);

  return response;
}

// Middleware を適用するパスを指定
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, *.svg, *.png, *.webp, *.ico (static assets)
     * - scripts, styles (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.svg$|.*\\.png$|.*\\.webp$|.*\\.ico$|scripts|styles|icons).*)',
  ],
};
