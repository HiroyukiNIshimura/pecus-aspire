import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse, WorkspaceListItemResponse, WorkspaceStatistics } from '@/connectors/api/pecus';
import WorkspacesClient from './WorkspacesClient';

export const dynamic = 'force-dynamic';

/**
 * ワークスペース一覧ページ（SSR）
 * ログインユーザーがアクセス可能なワークスペースを表示
 */
export default async function WorkspacesPage() {
  let genres: MasterGenreResponse[] = [];
  let initialWorkspaces: WorkspaceListItemResponse[] = [];
  let initialTotalPages = 1;
  let initialTotalCount = 0;
  let initialStatistics: WorkspaceStatistics | null = null;

  try {
    const api = await createPecusApiClients();

    // ジャンル一覧とワークスペース一覧を並列で取得
    const [genresResponse, workspacesResponse] = await Promise.all([
      api.master.getApiMasterGenres(),
      api.workspace.getApiWorkspaces(1, true), // 初期表示: page=1, isActive=true
    ]);

    genres = genresResponse;
    initialWorkspaces = workspacesResponse.data || [];
    initialTotalPages = workspacesResponse.totalPages || 1;
    initialTotalCount = workspacesResponse.totalCount || 0;
    initialStatistics = workspacesResponse.summary || null;
  } catch (error) {
    console.error('WorkspacesPage: failed to fetch initial data', error);
  }

  return (
    <WorkspacesClient
      genres={genres}
      initialWorkspaces={initialWorkspaces}
      initialTotalPages={initialTotalPages}
      initialTotalCount={initialTotalCount}
      initialStatistics={initialStatistics}
    />
  );
}
