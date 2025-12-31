import { notFound, redirect } from 'next/navigation';
import { getWorkspaceDetail } from '@/actions/admin/workspace';
import {
  createPecusApiClients,
  detect401ValidationError,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse } from '@/connectors/api/pecus';
import EditWorkspaceClient from './EditWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function EditWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = parseInt(id, 10);

  if (Number.isNaN(workspaceId) || workspaceId <= 0) {
    notFound();
  }

  let workspaceDetail = null;
  let genres: MasterGenreResponse[] = [];
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // 認証チェック（プロフィール取得）
    await api.profile.getApiProfile();

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

    fetchError = getUserSafeErrorMessage(error, 'データの取得中にエラーが発生しました。');
  }

  if (!workspaceDetail) {
    notFound();
  }

  return <EditWorkspaceClient workspaceDetail={workspaceDetail} genres={genres} fetchError={fetchError} />;
}
