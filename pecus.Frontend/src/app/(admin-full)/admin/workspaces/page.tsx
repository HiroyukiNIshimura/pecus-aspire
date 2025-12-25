import { redirect } from 'next/navigation';
import { getGenres } from '@/actions/master';
import { createPecusApiClients, detect401ValidationError } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse } from '@/connectors/api/pecus';
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
  let genres: MasterGenreResponse[] = [];

  try {
    const api = createPecusApiClients();

    // 認証チェック（プロフィール取得）
    await api.profile.getApiProfile();

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

  return <AdminWorkspacesClient initialGenres={genres} />;
}
