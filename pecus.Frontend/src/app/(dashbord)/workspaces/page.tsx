import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse } from '@/connectors/api/pecus';
import WorkspacesClient from './WorkspacesClient';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース一覧ページ（SSR）
 * ログインユーザーがアクセス可能なワークスペースを表示
 */
export default async function WorkspacesPage() {
  let genres: MasterGenreResponse[] = [];

  try {
    const api = createPecusApiClients();

    // ジャンル一覧を取得
    genres = await api.master.getApiMasterGenres();
  } catch (error) {
    console.error('WorkspacesPage: failed to fetch genres', error);
  }

  return <WorkspacesClient genres={genres} />;
}
