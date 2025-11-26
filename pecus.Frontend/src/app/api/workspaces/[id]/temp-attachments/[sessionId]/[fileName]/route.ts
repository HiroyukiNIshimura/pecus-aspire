import { type NextRequest, NextResponse } from 'next/server';
import { parseRouterError } from '@/app/api/routerError';
import { createAuthenticatedAxios } from '@/connectors/api/PecusApiClient';

export const dynamic = 'force-dynamic';

/**
 * 一時ファイルプレビュー取得APIルート
 * GET /api/workspaces/{id}/temp-attachments/{sessionId}/{fileName}
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string; fileName: string }> },
) {
  try {
    const { id, sessionId, fileName } = await params;
    const workspaceId = parseInt(id, 10);

    if (Number.isNaN(workspaceId)) {
      return NextResponse.json({ error: '無効なワークスペースIDです。' }, { status: 400 });
    }

    if (!sessionId || sessionId.length === 0 || sessionId.length > 50) {
      return NextResponse.json({ error: '無効なセッションIDです。' }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: 'ファイル名が指定されていません。' }, { status: 400 });
    }

    // 認証済みAxiosインスタンスを作成
    const axios = await createAuthenticatedAxios();

    // バックエンドから一時ファイルを取得
    const response = await axios.get(`/api/workspaces/${workspaceId}/temp-attachments/${sessionId}/${fileName}`, {
      responseType: 'arraybuffer',
    });

    // Content-Type を取得（バックエンドからのレスポンスヘッダー）
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    // ファイルの内容をそのまま返す
    return new NextResponse(Buffer.from(response.data), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Failed to get temp file:', error);
    return parseRouterError(error, 'ファイルの取得に失敗しました');
  }
}
