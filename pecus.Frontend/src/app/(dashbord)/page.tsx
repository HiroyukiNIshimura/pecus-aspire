import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function Dashboard() {
  let userResponse: UserDetailResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();
  } catch (error) {
    console.error('Dashboard: failed to fetch user', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'ユーザー情報の取得に失敗しました').message;
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserDetailResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return <DashboardClient initialUser={user} fetchError={fetchError} />;
}
