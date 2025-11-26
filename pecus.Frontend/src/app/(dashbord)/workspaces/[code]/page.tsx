export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import {
  createPecusApiClients,
  detect401ValidationError,
  detect404ValidationError,
} from '@/connectors/api/PecusApiClient';
import type {
  UserResponse,
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
}

export default async function WorkspaceDetailPage({ params }: WorkspaceDetailPageProps) {
  const { code } = await params;

  // ユーザー情報取得
  let userInfo: UserInfo | null = null;
  let userResponse: UserResponse | null = null;
  let workspaceDetail: WorkspaceFullDetailResponse | null = null;
  let workspacesList: WorkspaceListItemResponseWorkspaceStatisticsPagedResponse | null = null;

  try {
    const api = createPecusApiClients();
    userResponse = await api.profile.getApiProfile();
    userInfo = mapUserResponseToUserInfo(userResponse);

    // ワークスペース詳細情報取得（code ベース）
    workspaceDetail = await api.workspace.getApiWorkspacesCode(code);

    // ワークスペース一覧取得（切り替え用）
    try {
      workspacesList = await api.workspace.getApiWorkspaces(1, true, undefined, undefined);
    } catch (err) {
      console.warn('Failed to fetch workspaces list:', err);
      // ワークスペース一覧取得失敗時は空配列を渡す
      workspacesList = { data: [] };
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
    />
  );
}
