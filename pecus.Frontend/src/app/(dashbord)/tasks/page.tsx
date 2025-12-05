export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchMyTaskWorkspaces } from '@/actions/myTask';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MyTaskWorkspaceResponse, UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import MyTasksDashboardClient from './MyTasksDashboardClient';

export default async function MyTasksPage() {
  let userResponse: UserDetailResponse | null = null;
  let initialWorkspaces: MyTaskWorkspaceResponse[] = [];
  let taskTypes: TaskTypeOption[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // マイタスクワークスペース一覧を取得
    const workspacesResult = await fetchMyTaskWorkspaces();
    if (workspacesResult.success) {
      initialWorkspaces = workspacesResult.data;
    } else {
      fetchError = workspacesResult.message;
    }

    // タスクタイプ一覧取得（モーダル編集用）
    try {
      const taskTypeResponse = await api.master.getApiMasterTaskTypes();
      taskTypes = taskTypeResponse.map((t) => ({
        id: t.id,
        code: t.code ?? '',
        name: t.name ?? '',
        icon: t.icon,
      }));
    } catch (err) {
      console.warn('Failed to fetch task types:', err);
      taskTypes = [];
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

  return (
    <MyTasksDashboardClient
      initialUser={user}
      initialWorkspaces={initialWorkspaces}
      taskTypes={taskTypes}
      fetchError={fetchError}
    />
  );
}
