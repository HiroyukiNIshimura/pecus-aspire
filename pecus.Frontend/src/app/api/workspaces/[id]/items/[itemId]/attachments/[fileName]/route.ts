import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createAuthenticatedAxios } from '@/connectors/api/PecusApiClient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workspaces/{id}/items/{itemId}/attachments/{fileName}
 * 添付ファイルをプロキシ経由で取得（認証を代行）
 * エディタ内の画像表示に使用
 */
export async function GET(
  _request: NextRequest,
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

    // 認証済みAxiosでバックエンドから画像を取得
    const axios = await createAuthenticatedAxios();
    const response = await axios.get(
      `/api/workspaces/${workspaceId}/items/${workspaceItemId}/attachments/download/${fileName}`,
      {
        responseType: 'arraybuffer',
      },
    );

    // Content-Type を取得（デフォルトは application/octet-stream）
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    // 画像データをそのまま返却
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600', // 1時間キャッシュ
      },
    });
  } catch (error) {
    console.error('Attachment proxy error:', error);
    return parseRouterError(error, '添付ファイルの取得に失敗しました');
  }
}
