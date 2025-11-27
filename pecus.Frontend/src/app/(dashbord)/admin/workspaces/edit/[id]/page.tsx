import { notFound, redirect } from 'next/navigation';
import { getWorkspaceDetail } from '@/actions/admin/workspace';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse, UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import EditWorkspaceClient from './EditWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function EditWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = parseInt(id, 10);

  if (Number.isNaN(workspaceId) || workspaceId <= 0) {
    notFound();
  }

  let userResponse: UserDetailResponse | null = null;
  let workspaceDetail = null;
  let genres: MasterGenreResponse[] = [];
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // ワークスペース詳細を取得
    const workspaceResult = await getWorkspaceDetail(workspaceId);
    if (workspaceResult.success) {
      workspaceDetail = workspaceResult.data;
    } else {
      fetchError = workspaceResult.error;
    }

    // ジャンル一覧を取得
    if (!fetchError) {
      const genresResponse = await api.master.getApiMasterGenres();
      genres = genresResponse || [];
    }
  } catch (error) {
    console.error('EditWorkspacePage: failed to fetch workspace', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得中にエラーが発生しました。').message;
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserDetailResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  if (!workspaceDetail) {
    notFound();
  }

  return (
    <EditWorkspaceClient initialUser={user} workspaceDetail={workspaceDetail} genres={genres} fetchError={fetchError} />
  );
}
