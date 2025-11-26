import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ワークスペースアイテム一覧取得 API Route
 * GET /api/workspaces/[id]/items?page=1
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);
    const page = request.nextUrl.searchParams.get('page') ? parseInt(request.nextUrl.searchParams.get('page')!, 10) : 1;

    if (Number.isNaN(workspaceId)) {
      return badRequestError('Invalid workspace ID');
    }

    const api = createPecusApiClients();
    const response = await api.workspace.getApiWorkspacesItems(workspaceId, page);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch workspace items:', error);
    return parseRouterError(error, 'ワークスペースアイテムの取得に失敗しました');
  }
}
