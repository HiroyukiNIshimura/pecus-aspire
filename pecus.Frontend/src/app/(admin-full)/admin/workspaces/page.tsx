import { redirect } from 'next/navigation';
import { getGenres } from '@/actions/master';
import { createPecusApiClients, detect401ValidationError } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse, UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import AdminWorkspacesClient from './AdminWorkspacesClient';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース管理ページ（SSR）
 *
 * NOTE: ワークスペース一覧データはClient側でフェッチする
 * （SSRでHTMLレンダリングしないデータをSSRでフェッチしない方針）
 * ジャンルはフィルターUIで使用するマスタデータなのでSSRで取得する
 */
export default async function AdminWorkspaces() {
  let userResponse: UserDetailResponse | null = null;
  let genres: MasterGenreResponse[] = [];

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得（認証チェック）
    userResponse = await api.profile.getApiProfile();

    // ジャンル情報を取得（フィルターUIで使用するマスタデータ）
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
  }

  // ユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserDetailResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return <AdminWorkspacesClient initialUser={user} initialGenres={genres} />;
}
