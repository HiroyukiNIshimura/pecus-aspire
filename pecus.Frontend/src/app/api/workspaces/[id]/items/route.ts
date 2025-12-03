import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { TaskPriority } from '@/connectors/api/pecus';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * ワークスペースアイテム一覧取得 API Route
 * GET /api/workspaces/[id]/items?page=1&searchQuery=xxx&...
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);
    const searchParams = request.nextUrl.searchParams;

    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const searchQuery = searchParams.get('searchQuery') || undefined;
    const isDraft = searchParams.get('isDraft') !== null ? searchParams.get('isDraft') === 'true' : undefined;
    const isArchived = searchParams.get('isArchived') !== null ? searchParams.get('isArchived') === 'true' : undefined;
    const assigneeId = searchParams.get('assigneeId') ? parseInt(searchParams.get('assigneeId')!, 10) : undefined;
    const ownerId = searchParams.get('ownerId') ? parseInt(searchParams.get('ownerId')!, 10) : undefined;
    const committerId = searchParams.get('committerId') ? parseInt(searchParams.get('committerId')!, 10) : undefined;
    const priority = (searchParams.get('priority') as TaskPriority) || undefined;
    const pinned = searchParams.get('pinned') !== null ? searchParams.get('pinned') === 'true' : undefined;
    const hasDueDate = searchParams.get('hasDueDate') !== null ? searchParams.get('hasDueDate') === 'true' : undefined;

    if (Number.isNaN(workspaceId)) {
      return badRequestError('Invalid workspace ID');
    }

    const api = createPecusApiClients();
    // WorkspaceItemService を使用（pgroonga によるあいまい検索対応）
    const response = await api.workspaceItem.getApiWorkspacesItems(
      workspaceId,
      page,
      isDraft,
      isArchived,
      assigneeId,
      ownerId,
      committerId,
      priority,
      pinned,
      hasDueDate,
      searchQuery,
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch workspace items:', error);
    return parseRouterError(error, 'ワークスペースアイテムの取得に失敗しました');
  }
}
