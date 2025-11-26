import { type NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/actions/admin/user';
import { parseRouterError } from '../../routerError';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = searchParams.get('PageSize') ? parseInt(searchParams.get('PageSize')!, 10) : undefined;

    // フィルタパラメータの処理
    const isActiveParam = searchParams.get('IsActive');
    let isActive: boolean | undefined;
    if (isActiveParam !== null) {
      isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;
    }

    const username = searchParams.get('Username') || undefined;

    // SkillIds は複数の値を取得する可能性がある
    const skillIdStrings = searchParams.getAll('SkillIds');
    const skillIds = skillIdStrings.length > 0 ? skillIdStrings.map((id) => parseInt(id, 10)) : undefined;

    // SkillFilterMode の取得（デフォルトは 'and'）
    const skillFilterMode = searchParams.get('SkillFilterMode') || 'and';

    const result = await getUsers(page, pageSize, isActive, username, skillIds, skillFilterMode);

    if (result.success) {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('API Route Error:', error);

    const errorRes = parseRouterError(error, 'ユーザー一覧の取得に失敗しました');
    return NextResponse.json(errorRes);
  }
}
