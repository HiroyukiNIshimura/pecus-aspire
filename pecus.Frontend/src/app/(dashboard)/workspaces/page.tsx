import { fetchWorkspaces } from '@/actions/workspace';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type {
  MasterGenreResponse,
  PagedResponseOfWorkspaceListItemResponse,
  WorkspaceStatistics,
} from '@/connectors/api/pecus';
import WorkspacesClient from './WorkspacesClient';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース一覧ページ（SSR）
 * ログインユーザーがアクセス可能なワークスペースを表示
 *
 * 初期データ（1ページ目）、統計情報、ジャンル一覧をSSRで取得
 */
export default async function WorkspacesPage() {
  let genres: MasterGenreResponse[] = [];
  let statistics: WorkspaceStatistics | null = null;
  let initialWorkspaces: PagedResponseOfWorkspaceListItemResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = await createPecusApiClients();

    // ジャンル一覧、統計情報、初期ワークスペース一覧を並列取得
    const [genresResult, statisticsResult, workspacesResult] = await Promise.all([
      api.master.getApiMasterGenres(),
      api.workspace.getApiWorkspacesStatistics(),
      fetchWorkspaces(1),
    ]);

    genres = genresResult;
    statistics = statisticsResult;

    if (workspacesResult.success) {
      initialWorkspaces = workspacesResult.data;
    } else {
      fetchError = workspacesResult.message;
    }
  } catch (error) {
    console.error('WorkspacesPage: failed to fetch data', error);
    fetchError = 'データの取得に失敗しました';
  }

  return (
    <WorkspacesClient
      genres={genres}
      initialStatistics={statistics}
      initialWorkspaces={initialWorkspaces}
      fetchError={fetchError}
    />
  );
}
