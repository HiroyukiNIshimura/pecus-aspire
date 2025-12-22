import { type NextRequest, NextResponse } from 'next/server';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { parseRouterError } from '../routerError';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース一覧取得APIルート
 * GET /api/workspaces?page={page}&Name={string}&GenreId={number}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const name = searchParams.get('Name') || undefined;
    const genreIdParam = searchParams.get('GenreId');

    const genreId = genreIdParam ? parseInt(genreIdParam, 10) : undefined;

    // API クライアント生成
    const clients = await createPecusApiClients();

    // ワークスペース一覧取得
    const response = await clients.workspace.getApiWorkspaces(page, genreId, name);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return parseRouterError(error, 'ワークスペース一覧の取得に失敗しました');
  }
}
