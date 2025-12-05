export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchMyTasks } from '@/actions/myTask';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse,
  UserDetailResponse,
} from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import MyTasksClient from './MyTasksClient';

export default async function MyTasksPage() {
  let userResponse: UserDetailResponse | null = null;
  let initialData: MyTaskDetailResponseWorkspaceTaskStatisticsPagedResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // マイタスクを取得（初期はアクティブのみ）
    const tasksResult = await fetchMyTasks(1, 'Active');
    if (tasksResult.success) {
      initialData = tasksResult.data;
    } else {
      fetchError = tasksResult.message;
    }
  } catch (error) {
    console.error('MyTasksPage: failed to fetch data', error);

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

  return <MyTasksClient initialUser={user} initialData={initialData} fetchError={fetchError} />;
}
