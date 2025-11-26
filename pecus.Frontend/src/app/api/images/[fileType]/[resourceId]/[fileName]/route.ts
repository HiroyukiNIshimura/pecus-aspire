import { type NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // resourceId のバリデーション
    const resourceIdNum = parseInt(resourceId, 10);
    if (Number.isNaN(resourceIdNum) || resourceIdNum <= 0) {
      return NextResponse.json({ error: 'Invalid resource ID' }, { status: 400 });
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
  } catch (error: any) {
    console.error('Image proxy error:', error);
    console.error('Error response status:', error.response?.status);
    console.error('Error response data:', error.response?.data?.toString?.() || error.response?.data);

    // 認証エラーの場合は401を返す
    if (error.response?.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 404エラーの場合
    if (error.response?.status === 404) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch image' },
      { status: error.response?.status || 500 },
    );
  }
}
