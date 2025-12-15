export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchMyActivities } from '@/actions/activity';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { ActivityResponsePagedResponse, UserDetailResponse } from '@/connectors/api/pecus';
import ActivityClient from './ActivityClient';

export default async function ActivityPage() {
  let userResponse: UserDetailResponse | null = null;
  let initialActivities: ActivityResponsePagedResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // 初回は「今日」のアクティビティを取得
    const activitiesResult = await fetchMyActivities(1, 'Today');
    if (activitiesResult.success) {
      initialActivities = activitiesResult.data;
    } else {
      fetchError = activitiesResult.message;
    }
  } catch (error) {
    console.error('ActivityPage: failed to fetch data', error);

    const noAuthError = detect401ValidationError(error);
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得に失敗しました').message;
  }

  if (!userResponse) {
    redirect('/signin');
  }

  return (
    <ActivityClient
      initialUserName={userResponse.username ?? ''}
      initialUserIconUrl={userResponse.identityIconUrl}
      initialActivities={initialActivities}
      fetchError={fetchError}
    />
  );
}
