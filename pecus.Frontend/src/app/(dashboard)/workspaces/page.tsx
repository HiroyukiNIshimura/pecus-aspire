import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse, WorkspaceStatistics } from '@/connectors/api/pecus';
import WorkspacesClient from './WorkspacesClient';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース一覧ページ（SSR）
 * ログインユーザーがアクセス可能なワークスペースを表示
 *
 * NOTE: ワークスペース一覧データはClient側でフェッチする
 * （SSRでHTMLレンダリングしないデータをSSRでフェッチしない方針）
 * 統計情報はフィルタに依存しないためSSRで取得
 */
export default async function WorkspacesPage() {
  let genres: MasterGenreResponse[] = [];
  let statistics: WorkspaceStatistics | null = null;

  try {
    const api = await createPecusApiClients();

    // ジャンル一覧と統計情報を並列取得
    const [genresResult, statisticsResult] = await Promise.all([
      api.master.getApiMasterGenres(),
      api.workspace.getApiWorkspacesStatistics(),
    ]);

    genres = genresResult;
    statistics = statisticsResult;
  } catch (error) {
    console.error('WorkspacesPage: failed to fetch data', error);
  }

  return <WorkspacesClient genres={genres} initialStatistics={statistics} />;
}
