import { notFound } from 'next/navigation';
import { getWorkspaceDetail } from '@/actions/admin/workspace';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { MasterGenreResponse } from '@/connectors/api/pecus';
import { handleServerFetch } from '@/libs/serverFetch';
import EditWorkspaceClient from './EditWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function EditWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = parseInt(id, 10);

  if (Number.isNaN(workspaceId) || workspaceId <= 0) {
    notFound();
  }

  const api = createPecusApiClients();
  const authResult = await handleServerFetch(() => api.profile.getApiProfile());

  if (!authResult.success) {
    if (authResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/admin/workspaces" backLabel="ワークスペース一覧に戻る" />;
    }
    return <FetchError message={authResult.message} backUrl="/admin/workspaces" backLabel="ワークスペース一覧に戻る" />;
  }

  const workspaceResult = await getWorkspaceDetail(workspaceId);
  if (!workspaceResult.success) {
    if (workspaceResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/admin/workspaces" backLabel="ワークスペース一覧に戻る" />;
    }
    if (workspaceResult.error === 'not_found') {
      notFound();
    }
    return (
      <FetchError message={workspaceResult.message} backUrl="/admin/workspaces" backLabel="ワークスペース一覧に戻る" />
    );
  }

  let genres: MasterGenreResponse[] = [];
  const genresResponse = await api.master.getApiMasterGenres();
  genres = genresResponse || [];

  return <EditWorkspaceClient workspaceDetail={workspaceResult.data} genres={genres} fetchError={null} />;
}
