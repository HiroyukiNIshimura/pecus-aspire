import { type NextRequest, NextResponse } from 'next/server';
import { parseRouterError } from '@/app/api/routerError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { id, itemId } = await params;
    const workspaceId = parseInt(id, 10);
    const itemIdNum = parseInt(itemId, 10);

    if (Number.isNaN(workspaceId) || Number.isNaN(itemIdNum)) {
      return NextResponse.json({ error: 'Invalid workspace ID or item ID' }, { status: 400 });
    }

    const clients = await createPecusApiClients();
    const data = await clients.workspaceItem.getApiWorkspacesItems1(workspaceId, itemIdNum);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch workspace item detail:', error);
    return parseRouterError(error, 'ワークスペースアイテムの取得に失敗しました');
  }
}
