export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { fetchWorkspaceItemByCode } from '@/actions/workspaceItem';
import type { TaskTypeOption } from '@/components/workspaces/TaskTypeSelect';
import {
  createPecusApiClients,
  detect401ValidationError,
  detect404ValidationError,
} from '@/connectors/api/PecusApiClient';
import type {
  MasterGenreResponse,
  MasterSkillResponse,
  UserDetailResponse,
  WorkspaceFullDetailResponse,
  WorkspaceListItemResponseWorkspaceStatisticsPagedResponse,
} from '@/connectors/api/pecus';
import type { UserInfo } from '@/types/userInfo';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import WorkspaceDetailClient from './WorkspaceDetailClient';

interface WorkspaceDetailPageProps {
  params: Promise<{
    code: string;
  }>;
  searchParams: Promise<{
    itemCode?: string;
  }>;
}

export default async function WorkspaceDetailPage({ params, searchParams }: WorkspaceDetailPageProps) {
  const { code } = await params;
  const { itemCode } = await searchParams;

  // ユーザー情報取得
  let userInfo: UserInfo | null = null;
  let userResponse: UserDetailResponse | null = null;
  let workspaceDetail: WorkspaceFullDetailResponse | null = null;
  let workspacesList: WorkspaceListItemResponseWorkspaceStatisticsPagedResponse | null = null;
  let genres: MasterGenreResponse[] = [];
  let skills: MasterSkillResponse[] = [];
  let taskTypes: TaskTypeOption[] = [];
  let initialItemId: number | undefined;

  try {
    const api = createPecusApiClients();
    userResponse = await api.profile.getApiProfile();
    userInfo = mapUserResponseToUserInfo(userResponse);

    // ワークスペース詳細情報取得（code ベース）
    workspaceDetail = await api.workspace.getApiWorkspacesCode(code);

    // itemCode が指定されている場合、アイテムIDを解決
    if (itemCode && workspaceDetail) {
      const itemResult = await fetchWorkspaceItemByCode(workspaceDetail.id, itemCode);
      if (itemResult.success && itemResult.data) {
        initialItemId = itemResult.data.id;
      }
      // アイテムが見つからない場合は無視（ワークスペース詳細を表示）
    }

    // ワークスペース一覧取得（切り替え用）
    try {
      workspacesList = await api.workspace.getApiWorkspaces(1, true, undefined, undefined);
    } catch (err) {
      console.warn('Failed to fetch workspaces list:', err);
      // ワークスペース一覧取得失敗時は空配列を渡す
      workspacesList = { data: [] };
    }

    // ジャンル一覧取得（編集用）
    try {
      genres = await api.master.getApiMasterGenres();
    } catch (err) {
      console.warn('Failed to fetch genres:', err);
      // ジャンル一覧取得失敗時は空配列を渡す
      genres = [];
    }

    // スキル一覧取得（編集用）
    try {
      skills = await api.master.getApiMasterSkills();
    } catch (err) {
      console.warn('Failed to fetch skills:', err);
      // スキル一覧取得失敗時は空配列を渡す
      skills = [];
    }

    // タスクタイプ一覧取得
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
      // タスクタイプ一覧取得失敗時は空配列を渡す
      taskTypes = [];
    }
  } catch (error) {
    console.error('WorkspaceDetailPage: failed to fetch data', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    const notFoundError = detect404ValidationError(error);
    // ワークスペースが見つからない場合は一覧ページへリダイレクト
    if (notFoundError) {
      redirect('/workspaces');
    }
  }

  // ユーザー情報が取得できない場合はリダイレクト
  if (!userInfo) {
    redirect('/signin');
  }

  // ワークスペース情報が取得できない場合はリダイレクト
  if (!workspaceDetail) {
    redirect('/workspaces');
  }

  return (
    <WorkspaceDetailClient
      workspaceCode={code}
      workspaceDetail={workspaceDetail}
      workspaces={workspacesList?.data || []}
      userInfo={userInfo}
      genres={genres}
      skills={skills}
      taskTypes={taskTypes}
      initialItemId={initialItemId}
    />
  );
}
