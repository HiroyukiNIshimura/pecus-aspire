import { type NextRequest, NextResponse } from 'next/server';
import { getAdminWorkspacesWithHeyApi } from '@/connectors/HeyApiClient';
import { parseRouterError } from '../../routerError';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const isActive =
      searchParams.get('IsActive') === 'true' ? true : searchParams.get('IsActive') === 'false' ? false : undefined;
    const genreId = searchParams.get('GenreId') ? parseInt(searchParams.get('GenreId')!, 10) : undefined;
    const name = searchParams.get('Name') || undefined;

    const response = await getAdminWorkspacesWithHeyApi(page, isActive, genreId, name);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch workspaces:', error);
    return parseRouterError(error, 'ワークスペース一覧の取得に失敗しました');
  }
}
