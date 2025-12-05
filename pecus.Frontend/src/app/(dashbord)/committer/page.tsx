export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchMyCommitterWorkspaces } from '@/actions/myCommitter';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MyCommitterWorkspaceResponse, UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import CommitterDashboardClient from './CommitterDashboardClient';

export default async function CommitterDashboardPage() {
  let userResponse: UserDetailResponse | null = null;
  let initialWorkspaces: MyCommitterWorkspaceResponse[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // コミッターワークスペース一覧を取得
    const workspacesResult = await fetchMyCommitterWorkspaces();
    if (workspacesResult.success) {
      initialWorkspaces = workspacesResult.data;
    } else {
      fetchError = workspacesResult.message;
    }
  } catch (error) {
    console.error('CommitterDashboardPage: failed to fetch data', error);

    const noAuthError = detect401ValidationError(error);
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得に失敗しました').message;
  }

  if (!userResponse) {
    redirect('/signin');
  }

  const user = mapUserResponseToUserInfo(userResponse);

  return <CommitterDashboardClient initialUser={user} initialWorkspaces={initialWorkspaces} fetchError={fetchError} />;
}
