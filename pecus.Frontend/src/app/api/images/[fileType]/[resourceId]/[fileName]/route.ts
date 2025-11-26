import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createAuthenticatedAxios } from '@/connectors/api/PecusApiClient';

export const dynamic = 'force-dynamic';

/**
 * 画像プロキシAPI Route
 * GET /api/images/{fileType}/{resourceId}/{fileName}
 *
 * pecus.WebApi の /api/downloads/{fileType}/{resourceId}/{fileName} をプロキシして
 * 認証付きで画像を取得し、ブラウザに返します。
 *
 * @param fileType - ファイル種別（avatar, genre）
 * @param resourceId - リソースID（ユーザーIDまたはジャンルID）
 * @param fileName - ファイル名
 * @query useOriginal - 元画像（リサイズ前）を取得するかどうか
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileType: string; resourceId: string; fileName: string }> },
) {
  try {
    const { fileType, resourceId, fileName } = await params;
    const useOriginal = request.nextUrl.searchParams.get('useOriginal') === 'true';

    // fileType のバリデーション
    const validFileTypes = ['avatar', 'genre'];
    if (!validFileTypes.includes(fileType.toLowerCase())) {
      return badRequestError('Invalid file type');
    }

    // resourceId のバリデーション
    const resourceIdNum = parseInt(resourceId, 10);
    if (Number.isNaN(resourceIdNum) || resourceIdNum <= 0) {
      return badRequestError('Invalid resource ID');
    }

    // 認証済みAxiosインスタンスを作成
    const axios = await createAuthenticatedAxios();

    // バックエンドの新しいルートベースエンドポイントにアクセス
    const backendUrl = `/api/downloads/${fileType.toLowerCase()}/${resourceId}/${encodeURIComponent(fileName)}`;
    console.log('Fetching image from backend URL:', backendUrl);
    const response = await axios.get(backendUrl, {
      params: useOriginal ? { useOriginal: true } : undefined,
      responseType: 'arraybuffer',
    });

    // バックエンドから返されるContent-Typeを取得
    const contentType = response.headers['content-type'] || 'image/webp';

    // キャッシュヘッダーを設定（1時間キャッシュ）
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return parseRouterError(error, '画像の取得に失敗しました');
  }
}
