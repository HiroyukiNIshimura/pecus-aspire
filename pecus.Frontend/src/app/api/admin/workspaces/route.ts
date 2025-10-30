import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const api = createPecusApiClients();
    const data = await api.adminWorkspace.apiAdminWorkspacesGet({ page, activeOnly });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}