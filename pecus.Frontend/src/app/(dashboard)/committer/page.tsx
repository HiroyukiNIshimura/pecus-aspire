export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchMyCommitterWorkspaces } from '@/actions/myCommitter';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MyCommitterWorkspaceResponse, UserDetailResponse } from '@/connectors/api/pecus';
import CommitterDashboardClient from './CommitterDashboardClient';

export default async function CommitterDashboardPage() {
  let userResponse: UserDetailResponse | null = null;
  let initialWorkspaces: MyCommitterWorkspaceResponse[] = [];
  let taskTypes: TaskTypeOption[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得（認証確認のため）
    userResponse = await api.profile.getApiProfile();

    // コミッターワークスペース一覧を取得
    const workspacesResult = await fetchMyCommitterWorkspaces();
    if (workspacesResult.success) {
      // oldest due date でソート（早い期限が上）
      initialWorkspaces = [...workspacesResult.data].sort((a, b) => {
        if (!a.oldestDueDate && !b.oldestDueDate) return 0;
        if (!a.oldestDueDate) return 1;
        if (!b.oldestDueDate) return -1;
        return new Date(a.oldestDueDate).getTime() - new Date(b.oldestDueDate).getTime();
      });
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

  return (
    <CommitterDashboardClient initialWorkspaces={initialWorkspaces} taskTypes={taskTypes} fetchError={fetchError} />
  );
}
