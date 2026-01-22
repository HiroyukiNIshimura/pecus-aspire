import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createAuthenticatedAxios } from '@/connectors/api/PecusApiClient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workspaces/{id}/progress-report
 * ワークスペース進捗レポートをダウンロード（認証をプロキシ）
 *
 * クエリパラメータ:
 * - from: 開始日（YYYY-MM-DD形式）
 * - to: 終了日（YYYY-MM-DD形式）
 * - includeArchived: アーカイブ済みアイテムを含むか（true/false）
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (Number.isNaN(workspaceId)) {
      return badRequestError('無効なワークスペースIDです');
    }

    // クエリパラメータを取得
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const includeArchived = request.nextUrl.searchParams.get('includeArchived') === 'true';

    if (!from || !to) {
      return badRequestError('開始日と終了日を指定してください');
    }

    // 認証済みAxiosでバックエンドからファイルを取得
    const axios = await createAuthenticatedAxios();
    const response = await axios.get(`/api/workspaces/${workspaceId}/progress-report`, {
      params: { from, to, includeArchived },
      responseType: 'arraybuffer',
    });

    // バックエンドからの Content-Disposition ヘッダーを取得
    const backendContentDisposition = response.headers['content-disposition'] as string | undefined;

    // レスポンスヘッダーを構築
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
    };

    if (backendContentDisposition) {
      // バックエンドからのヘッダーをそのまま転送
      headers['Content-Disposition'] = backendContentDisposition;
    } else {
      // フォールバック: デフォルトのファイル名を生成
      const fromDate = from.replace(/-/g, '');
      const toDate = to.replace(/-/g, '');
      const encodedFileName = encodeURIComponent(`workspace_${workspaceId}_report_${fromDate}_${toDate}.json`).replace(
        /['()]/g,
        escape,
      );
      headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodedFileName}`;
    }

    return new NextResponse(response.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Progress report proxy error:', error);
    return parseRouterError(error, 'レポートの出力に失敗しました');
  }
}
