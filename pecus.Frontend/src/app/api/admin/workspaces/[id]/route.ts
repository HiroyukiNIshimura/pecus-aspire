import { type NextRequest, NextResponse } from 'next/server';
import { badRequestError, parseRouterError } from '@/app/api/routerError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const workspaceId = parseInt(id, 10);

    if (Number.isNaN(workspaceId) || workspaceId <= 0) {
      return badRequestError('Invalid workspace ID');
    }

    const api = createPecusApiClients();
    const response = await api.adminWorkspace.getApiAdminWorkspaces1(workspaceId);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch workspace detail:', error);
    return parseRouterError(error, 'ワークスペースの取得に失敗しました');
  }
}
