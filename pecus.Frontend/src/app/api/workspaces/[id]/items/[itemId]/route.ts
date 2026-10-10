import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { getWorkspaceItemByIdWithHeyApi } from '@/connectors/HeyApiClient';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { id, itemId } = await params;
    const workspaceId = parseInt(id, 10);
    const itemIdNum = parseInt(itemId, 10);

    if (Number.isNaN(workspaceId) || Number.isNaN(itemIdNum)) {
      return badRequestError('Invalid workspace ID or item ID');
    }

    const data = await getWorkspaceItemByIdWithHeyApi(workspaceId, itemIdNum);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch workspace item detail:', error);
    return parseRouterError(error, 'ワークスペースアイテムの取得に失敗しました');
  }
}
