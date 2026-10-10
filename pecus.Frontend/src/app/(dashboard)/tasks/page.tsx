export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchMyTaskWorkspaces } from '@/actions/myTask';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import { getMasterTaskTypesWithHeyApi, getProfileWithHeyApi } from '@/connectors/HeyApiClient';
import type { GetApiProfileResponse } from '@/connectors/hey-api-axios/types.gen';
import { detect401ValidationError, getUserSafeErrorMessage } from '@/connectors/legacy-api/PecusApiClient';
import type { MyTaskWorkspaceResponse } from '@/connectors/legacy-api/pecus';
import MyTasksDashboardClient from './MyTasksDashboardClient';

export default async function MyTasksPage() {
  let userResponse: GetApiProfileResponse | null = null;
  let initialWorkspaces: MyTaskWorkspaceResponse[] = [];
  let taskTypes: TaskTypeOption[] = [];
  let fetchError: string | null = null;

  try {
    // ユーザー情報を取得（認証確認のため）
    userResponse = await getProfileWithHeyApi();

    // マイタスクワークスペース一覧を取得
    const workspacesResult = await fetchMyTaskWorkspaces();
    if (workspacesResult.success) {
      initialWorkspaces = workspacesResult.data;
    } else {
      fetchError = workspacesResult.message;
    }

    // タスクタイプ一覧取得（モーダル編集用）
    try {
      const taskTypeResponse = await getMasterTaskTypesWithHeyApi();
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

    fetchError = getUserSafeErrorMessage(error, 'データの取得に失敗しました');
  }

  if (!userResponse) {
    redirect('/signin');
  }

  return (
    <MyTasksDashboardClient
      initialWorkspaces={initialWorkspaces}
      taskTypes={taskTypes}
      fetchError={fetchError}
      currentUser={{
        id: userResponse.id,
        username: userResponse.username || '',
        email: userResponse.email || '',
        identityIconUrl: userResponse.identityIconUrl || null,
      }}
    />
  );
}
