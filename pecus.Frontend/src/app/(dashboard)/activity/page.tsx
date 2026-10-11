export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchMyActivities } from '@/actions/activity';
import { getProfileWithHeyApi } from '@/connectors/HeyApiClient';
import type { GetApiProfileResponse, PagedResponseOfActivityResponse } from '@/connectors/hey-api-axios/types.gen';
import { detect401ValidationError, getUserSafeErrorMessage } from '@/libs/apiError';
import ActivityClient from './ActivityClient';

export default async function ActivityPage() {
  let userResponse: GetApiProfileResponse | null = null;
  let initialActivities: PagedResponseOfActivityResponse | null = null;
  let fetchError: string | null = null;

  try {
    // ユーザー情報を取得
    userResponse = await getProfileWithHeyApi();

    // 初回は「今日」のアクティビティを取得
    const activitiesResult = await fetchMyActivities({ page: 1, period: 'Today' });
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

    fetchError = getUserSafeErrorMessage(error, 'データの取得に失敗しました');
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
