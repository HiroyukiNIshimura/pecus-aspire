import { notFound } from 'next/navigation';
import { getTagDetail } from '@/actions/admin/tags';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import EditTagClient from './EditTagClient';

export const dynamic = 'force-dynamic';

export default async function EditTagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tagId = parseInt(id, 10);

  if (Number.isNaN(tagId) || tagId <= 0) {
    notFound();
  }

  const api = createPecusApiClients();
  const authResult = await handleServerFetch(() => api.profile.getApiProfile());

  if (!authResult.success) {
    if (authResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/admin/tags" backLabel="タグ一覧に戻る" />;
    }
    return <FetchError message={authResult.message} backUrl="/admin/tags" backLabel="タグ一覧に戻る" />;
  }

  const tagResult = await getTagDetail(tagId);
  if (!tagResult.success) {
    if (tagResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/admin/tags" backLabel="タグ一覧に戻る" />;
    }
    if (tagResult.error === 'not_found') {
      notFound();
    }
    return <FetchError message={tagResult.message} backUrl="/admin/tags" backLabel="タグ一覧に戻る" />;
  }

  return <EditTagClient tagDetail={tagResult.data} fetchError={null} />;
}
