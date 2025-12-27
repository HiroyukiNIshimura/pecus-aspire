import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createAuthenticatedAxios } from '@/connectors/api/PecusApiClient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workspaces/{id}/items/{itemId}/attachments/{fileName}
 * 添付ファイルをプロキシ経由で取得（認証を代行）
 *
 * クエリパラメータ:
 * - download=true: ダウンロードモード（Content-Disposition: attachment）
 * - download=false または未指定: インライン表示（エディタ内の画像表示用）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; fileName: string }> },
) {
  try {
    const { id, itemId, fileName } = await params;
    const workspaceId = parseInt(id, 10);
    const workspaceItemId = parseInt(itemId, 10);

    if (Number.isNaN(workspaceId) || Number.isNaN(workspaceItemId)) {
      return badRequestError('無効なワークスペースIDまたはアイテムIDです');
    }

    if (!fileName) {
      return badRequestError('ファイル名が指定されていません');
    }

    // ダウンロードモードかどうかを判定
    const isDownload = request.nextUrl.searchParams.get('download') === 'true';

    // 認証済みAxiosでバックエンドからファイルを取得
    const axios = await createAuthenticatedAxios();
    const response = await axios.get(
      `/api/workspaces/${workspaceId}/items/${workspaceItemId}/attachments/download/${fileName}`,
      {
        responseType: 'arraybuffer',
      },
    );

    // Content-Type を取得（デフォルトは application/octet-stream）
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    // レスポンスヘッダーを構築
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };

    if (isDownload) {
      // ダウンロードモード: ブラウザにダウンロードを促す
      // RFC 5987 に従い filename* で UTF-8 エンコード
      const encodedFileName = encodeURIComponent(fileName).replace(/['()]/g, escape);
      headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodedFileName}`;
    } else {
      // インラインモード: ブラウザ内で表示（キャッシュ有効）
      headers['Cache-Control'] = 'private, max-age=3600';
    }

    return new NextResponse(response.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Attachment proxy error:', error);
    return parseRouterError(error, '添付ファイルの取得に失敗しました');
  }
}
