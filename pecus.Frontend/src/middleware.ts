import { type JwtPayload, jwtDecode } from 'jwt-decode';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { RefreshRequest } from './connectors/api/pecus';
import { parseDeviceInfoFromUserAgent } from './utils/deviceInfo';

interface CustomJwtPayload extends JwtPayload {
  // JWTのクレームに対応（JwtBearerUtil.csで定義）
  userId?: string; // number形式の文字列として格納
  username?: string;
  email?: string;
  // rolesは複数のroleクレームとして格納されるため、jwt-decodeでは取得方法が異なる
}

/**
 * リフレッシュトークンを使用してアクセストークンを再取得
 * @param request NextRequest
 * @param refreshToken リフレッシュトークン
 * @param existingUserCookie 既存のuserクッキー（存在する場合）
 */
async function attemptRefresh(
  request: NextRequest,
  refreshToken: string,
  existingUserCookie: string | undefined,
): Promise<NextResponse> {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || 'https://localhost:7265';
    const clientUserAgent = request.headers.get('user-agent') ?? undefined;
    const forwardedForHeader = request.headers.get('x-forwarded-for') ?? undefined;
    const forwardedFor = forwardedForHeader?.split(',')[0].trim() || undefined;
    const realIp = request.headers.get('x-real-ip') ?? undefined;
    const clientIp = forwardedFor ?? realIp;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (clientUserAgent) headers['User-Agent'] = clientUserAgent;
    if (forwardedFor) headers['X-Forwarded-For'] = forwardedFor;
    if (clientIp) headers['X-Real-IP'] = clientIp;

    // User-Agent からデバイス情報を解析
    const { deviceName, deviceType, os } = parseDeviceInfoFromUserAgent(clientUserAgent);

    // タイムゾーンはリクエストヘッダーから取得を試みる（存在しない場合はundefined）
    const timezone = request.headers.get('x-timezone') ?? undefined;

    const body: RefreshRequest = {
      refreshToken,
      userAgent: clientUserAgent,
      ipAddress: clientIp,
      deviceName,
      deviceType,
      os,
      appVersion: undefined, // アプリバージョンはブラウザからは取得不可
      timezone,
      location: undefined, // ロケーションは別途位置情報APIが必要
    };

    const refreshResponse = await fetch(`${apiBaseUrl}/api/entrance/refresh`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!refreshResponse.ok) {
      console.error('[Middleware] Refresh failed:', refreshResponse.status);
      console.error('[Middleware] About to delete cookies and redirect to /signin');

      // リフレッシュトークンも無効な場合はクッキーをクリアしてログインページへ
      const response = NextResponse.redirect(new URL('/signin', request.url));

      // キャッシュ無効化ヘッダーを設定（ブラウザ・CDKの両方に対して）
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');

      response.cookies.delete('accessToken');
      response.cookies.delete('refreshToken');
      response.cookies.delete('user');

      return response;
    }

    const data = await refreshResponse.json();
    console.log('[Middleware] Token refreshed successfully');

    const toMaxAgeSeconds = (expiresAt?: string, fallbackSeconds: number = 60 * 60 * 24 * 30) => {
      if (!expiresAt) return fallbackSeconds;
      const expiresMs = Date.parse(expiresAt);
      if (Number.isNaN(expiresMs)) return fallbackSeconds;
      const diffSeconds = Math.floor((expiresMs - Date.now()) / 1000);
      return diffSeconds > 0 ? diffSeconds : fallbackSeconds;
    };

    // 新しいトークンをクッキーに設定してリクエストを続行
    const response = NextResponse.next();

    // キャッシュ無効化ヘッダーを設定（SSRコンポーネントのキャッシュを回避）
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    const baseCookieOptions = {
      path: '/',
      httpOnly: false,
      sameSite: 'strict' as const,
      secure: process.env.NODE_ENV === 'production',
    };

    const accessMaxAge = toMaxAgeSeconds(data.expiresAt, 60 * 60);
    const refreshMaxAge = toMaxAgeSeconds(data.refreshExpiresAt, 60 * 60 * 24 * 30);

    response.cookies.set('accessToken', data.accessToken, {
      ...baseCookieOptions,
      maxAge: accessMaxAge,
    });

    response.cookies.set('refreshToken', data.refreshToken, {
      ...baseCookieOptions,
      maxAge: refreshMaxAge,
    });

    // userクッキーが存在しない場合、アクセストークンからユーザー情報を復元
    if (!existingUserCookie) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(data.accessToken);
        // JWTのクレームからユーザー情報を構築
        // userId は文字列として格納されているので数値に変換
        const userInfo = {
          id: decoded.userId ? Number.parseInt(decoded.userId, 10) : 0,
          name: decoded.username ?? '',
          email: decoded.email ?? '',
          roles: [] as string[], // ロールはJWTから直接取得するのが複雑なため空配列で初期化
        };
        response.cookies.set('user', JSON.stringify(userInfo), {
          ...baseCookieOptions,
          maxAge: refreshMaxAge,
        });
        console.log('[Middleware] User cookie restored from token');
      } catch (decodeError) {
        console.error('[Middleware] Failed to decode new access token:', decodeError);
      }
    }

    return response;
  } catch (error) {
    console.error('[Middleware] Refresh error:', error);

    // エラー時はクッキーをクリアしてログインページへ
    const response = NextResponse.redirect(new URL('/signin', request.url));

    // キャッシュ無効化ヘッダーを設定
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    response.cookies.delete('user');
    return response;
  }
}
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
  const publicPaths = ['/signin', '/signup', '/forgot-password', '/password-reset', '/error-test'];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 静的リソース・API Routesはスキップ
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // クッキーからトークンを取得
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const userCookie = request.cookies.get('user')?.value;

  // トークンが存在しない場合はログインページへ
  if (!refreshToken) {
    console.log('[Middleware] No refresh token found, redirecting to signin');
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // アクセストークンがない場合はリフレッシュを試行
  if (!accessToken) {
    console.log('[Middleware] No access token found, attempting refresh with refresh token');
    return await attemptRefresh(request, refreshToken, userCookie);
  }

  try {
    // アクセストークンの有効期限をチェック
    const decoded: CustomJwtPayload = jwtDecode<CustomJwtPayload>(accessToken);
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = (decoded.exp ?? 0) - now;

    // 有効期限が5分以上残っている場合はそのまま通過
    if (expiresIn > 300) {
      console.log(`[Middleware] Access token valid for ${expiresIn}s, allowing access`);
      const response = NextResponse.next();
      // 保護されたページもキャッシュ無効化（セッション依存のため）
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');
      return response;
    }

    // 有効期限が5分未満の場合はリフレッシュを試行
    console.log(`[Middleware] Access token expiring in ${expiresIn}s, attempting refresh`);
    return await attemptRefresh(request, refreshToken, userCookie);
  } catch (error) {
    console.error('[Middleware] Token validation error:', error);

    // トークンのデコードに失敗した場合、リフレッシュを試行
    if (refreshToken) {
      console.log('[Middleware] Token decode failed, attempting refresh');
      return await attemptRefresh(request, refreshToken, userCookie);
    }

    // リフレッシュトークンもない場合はクッキーをクリア
    const response = NextResponse.redirect(new URL('/signin', request.url));

    // キャッシュ無効化ヘッダーを設定
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

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
