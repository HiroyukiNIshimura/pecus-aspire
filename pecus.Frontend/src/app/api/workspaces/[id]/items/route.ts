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
 * GET /api/workspaces/[id]/items?page=1&searchQuery=xxx
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);
    const page = request.nextUrl.searchParams.get('page') ? parseInt(request.nextUrl.searchParams.get('page')!, 10) : 1;
    const searchQuery = request.nextUrl.searchParams.get('searchQuery') || undefined;

    if (Number.isNaN(workspaceId)) {
      return badRequestError('Invalid workspace ID');
    }

    const api = createPecusApiClients();
    // WorkspaceItemService を使用（pgroonga によるあいまい検索対応）
    const response = await api.workspaceItem.getApiWorkspacesItems(
      workspaceId,
      page,
      undefined, // isDraft
      undefined, // isArchived
      undefined, // assigneeId
      undefined, // priority
      undefined, // pinned
      searchQuery,
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch workspace items:', error);
    return parseRouterError(error, 'ワークスペースアイテムの取得に失敗しました');
  }
}
