import { type NextRequest, NextResponse } from 'next/server';
import { getAdminSkillsWithHeyApi } from '@/connectors/HeyApiClient';
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

    const response = await getAdminSkillsWithHeyApi(page, isActive, unusedOnly, name);

    return NextResponse.json(response);
  } catch (error) {
    console.error('API Route /api/admin/skills - Error:', error);
    return parseRouterError(error, 'スキル一覧の取得に失敗しました');
  }
}
