import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse } from '@/connectors/api/pecus';
import WorkspacesClient from './WorkspacesClient';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース一覧ページ（SSR）
 * ログインユーザーがアクセス可能なワークスペースを表示
 *
 * NOTE: ワークスペース一覧データはClient側でフェッチする
 * （SSRでHTMLレンダリングしないデータをSSRでフェッチしない方針）
 */
export default async function WorkspacesPage() {
  let genres: MasterGenreResponse[] = [];

  try {
    const api = await createPecusApiClients();

    // ジャンル一覧のみ取得（フィルターUIで使用するマスタデータ）
    genres = await api.master.getApiMasterGenres();
  } catch (error) {
    console.error('WorkspacesPage: failed to fetch genres', error);
  }

  return <WorkspacesClient genres={genres} />;
}
