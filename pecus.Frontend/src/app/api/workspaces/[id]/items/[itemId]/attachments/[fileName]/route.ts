import { type NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({ error: '無効なワークスペースIDまたはアイテムIDです' }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: 'ファイル名が指定されていません' }, { status: 400 });
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
  } catch (error: unknown) {
    console.error('Attachment proxy error:', error);

    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return NextResponse.json({ error: '添付ファイルが見つかりません' }, { status: 404 });
    }

    if (err.response?.status === 401) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    return NextResponse.json({ error: '添付ファイルの取得に失敗しました' }, { status: 500 });
  }
}
