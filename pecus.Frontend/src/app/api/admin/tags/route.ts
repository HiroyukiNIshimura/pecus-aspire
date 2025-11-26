import { type NextRequest, NextResponse } from 'next/server';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { parseRouterError } from '../../routerError';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const isActiveParam = searchParams.get('IsActive');
    const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;
    const unusedOnlyParam = searchParams.get('UnusedOnly');
    const unusedOnly = unusedOnlyParam === 'true' ? true : undefined;
    const name = searchParams.get('Name') || undefined;

    const api = createPecusApiClients();
    const response = await api.adminTag.getApiAdminTags(page, isActive, unusedOnly, name);

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Route /api/admin/tags - Error:', error);
    const errorRes = parseRouterError(error, 'タグ一覧の取得に失敗しました');
    return NextResponse.json(errorRes);
  }
}
