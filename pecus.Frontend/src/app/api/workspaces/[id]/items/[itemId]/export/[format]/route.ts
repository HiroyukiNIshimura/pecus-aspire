import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createAuthenticatedAxios } from '@/connectors/api/PecusApiClient';

export const dynamic = 'force-dynamic';

type ExportFormat = 'markdown' | 'html' | 'json';

const VALID_FORMATS: ExportFormat[] = ['markdown', 'html', 'json'];

const FORMAT_CONTENT_TYPES: Record<ExportFormat, string> = {
  markdown: 'text/markdown; charset=utf-8',
  html: 'text/html; charset=utf-8',
  json: 'application/json; charset=utf-8',
};

/**
 * GET /api/workspaces/{id}/items/{itemId}/export/{format}
 * ワークスペースアイテムをエクスポート（認証をプロキシ）
 *
 * @param format - エクスポート形式: markdown, html, json
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string; format: string }> },
) {
  try {
    const { id, itemId, format } = await params;
    const workspaceId = parseInt(id, 10);
    const workspaceItemId = parseInt(itemId, 10);

    if (Number.isNaN(workspaceId) || Number.isNaN(workspaceItemId)) {
      return badRequestError('無効なワークスペースIDまたはアイテムIDです');
    }

    if (!VALID_FORMATS.includes(format as ExportFormat)) {
      return badRequestError('無効なエクスポート形式です。markdown, html, json のいずれかを指定してください。');
    }

    const exportFormat = format as ExportFormat;

    // 認証済みAxiosでバックエンドからファイルを取得
    const axios = await createAuthenticatedAxios();
    const response = await axios.get(`/api/workspaces/${workspaceId}/items/${workspaceItemId}/export/${exportFormat}`, {
      responseType: 'arraybuffer',
    });

    // バックエンドからの Content-Disposition ヘッダーを取得
    const backendContentDisposition = response.headers['content-disposition'] as string | undefined;

    // レスポンスヘッダーを構築
    const headers: Record<string, string> = {
      'Content-Type': FORMAT_CONTENT_TYPES[exportFormat],
    };

    if (backendContentDisposition) {
      // バックエンドからのヘッダーをそのまま転送
      headers['Content-Disposition'] = backendContentDisposition;
    } else {
      // フォールバック: デフォルトのファイル名を生成
      const extension = exportFormat === 'markdown' ? 'md' : exportFormat;
      const encodedFileName = encodeURIComponent(`item-${workspaceItemId}.${extension}`).replace(/['()]/g, escape);
      headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodedFileName}`;
    }

    return new NextResponse(response.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Export proxy error:', error);
    return parseRouterError(error, 'エクスポートに失敗しました');
  }
}
