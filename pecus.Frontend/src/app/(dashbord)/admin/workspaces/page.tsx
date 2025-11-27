import { redirect } from 'next/navigation';
import { getWorkspaces } from '@/actions/admin/workspace';
import { getGenres } from '@/actions/master';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type {
  MasterGenreResponse,
  UserDetailResponse,
  WorkspaceListItemResponse,
  WorkspaceStatistics,
} from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import AdminWorkspacesClient from './AdminWorkspacesClient';

export const dynamic = 'force-dynamic';

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminWorkspaces() {
  let workspaces: WorkspaceListItemResponse[] = [];
  let totalCount: number = 0;
  let totalPages: number = 1;
  let statistics: WorkspaceStatistics | null = null;
  let userResponse: UserDetailResponse | null = null;
  let genres: MasterGenreResponse[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // ワークスペース情報を取得
    const workspacesResult = await getWorkspaces(1, true);
    if (workspacesResult.success) {
      const responseData = workspacesResult.data;
      workspaces = responseData?.data ?? [];
      totalCount = responseData?.totalCount ?? 0;
      totalPages = responseData?.totalPages ?? 1;
      statistics = responseData?.summary ?? null;
    } else {
      fetchError = `ワークスペース情報の取得に失敗しました (${workspacesResult.error})`;
    }

    // ジャンル情報を取得
    const genresResult = await getGenres();
    if (genresResult.success) {
      genres = genresResult.data ?? [];
    }
  } catch (error) {
    console.error('AdminWorkspaces: failed to fetch data', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得に失敗しました').message;
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserDetailResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return (
    <AdminWorkspacesClient
      initialWorkspaces={workspaces}
      initialTotalCount={totalCount}
      initialTotalPages={totalPages}
      initialUser={user}
      initialStatistics={statistics}
      initialGenres={genres}
      fetchError={fetchError}
    />
  );
}
