import { type NextRequest, NextResponse } from 'next/server';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { parseRouterError } from '../routerError';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース一覧取得APIルート
 * GET /api/workspaces?page={page}&IsActive={bool}&Name={string}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const isActiveParam = searchParams.get('IsActive');
    const name = searchParams.get('Name') || undefined;

    // クエリパラメータを整形
    const isActive =
      isActiveParam === null
        ? undefined
        : isActiveParam === 'true'
          ? true
          : isActiveParam === 'false'
            ? false
            : undefined;

    // API クライアント生成
    const clients = await createPecusApiClients();

    // ワークスペース一覧取得
    const response = await clients.workspace.getApiWorkspaces(
      page,
      isActive,
      undefined, // genreId（現在未使用）
      name,
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    const errorRes = parseRouterError(error, 'ワークスペース一覧の取得に失敗しました');
    return NextResponse.json(errorRes);
  }
}
