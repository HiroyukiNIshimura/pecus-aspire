import { getGenres } from '@/actions/master';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse } from '@/connectors/api/pecus';
import { handleServerFetch } from '@/libs/serverFetch';
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
  const api = createPecusApiClients();
  const result = await handleServerFetch(() => api.profile.getApiProfile());

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
  }

  let genres: MasterGenreResponse[] = [];
  const genresResult = await getGenres();
  if (genresResult.success) {
    genres = genresResult.data ?? [];
  }

  return <AdminWorkspacesClient initialGenres={genres} />;
}
