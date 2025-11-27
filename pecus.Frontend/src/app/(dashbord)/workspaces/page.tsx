import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse, UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import WorkspacesClient from './WorkspacesClient';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース一覧ページ（SSR）
 * ログインユーザーがアクセス可能なワークスペースを表示
 */
export default async function WorkspacesPage() {
  let userResponse: UserDetailResponse | null = null;
  let genres: MasterGenreResponse[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報とジャンル一覧を並行取得
    [userResponse, genres] = await Promise.all([api.profile.getApiProfile(), api.master.getApiMasterGenres()]);
  } catch (error) {
    console.error('WorkspacesPage: failed to fetch data', error);

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

  return <WorkspacesClient initialUser={user} fetchError={fetchError} genres={genres} />;
}
