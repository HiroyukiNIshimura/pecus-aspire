import { notFound } from 'next/navigation';
import { getSkillDetail } from '@/actions/admin/skills';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import EditSkillClient from './EditSkillClient';

export const dynamic = 'force-dynamic';

export default async function EditSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skillId = parseInt(id, 10);

  if (Number.isNaN(skillId) || skillId <= 0) {
    notFound();
  }

  const api = createPecusApiClients();
  const authResult = await handleServerFetch(() => api.profile.getApiProfile());

  if (!authResult.success) {
    if (authResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/admin/skills" backLabel="スキル一覧に戻る" />;
    }
    return <FetchError message={authResult.message} backUrl="/admin/skills" backLabel="スキル一覧に戻る" />;
  }

  const skillResult = await getSkillDetail(skillId);
  if (!skillResult.success) {
    if (skillResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/admin/skills" backLabel="スキル一覧に戻る" />;
    }
    if (skillResult.error === 'not_found') {
      notFound();
    }
    return <FetchError message={skillResult.message} backUrl="/admin/skills" backLabel="スキル一覧に戻る" />;
  }

  return <EditSkillClient skillDetail={skillResult.data} fetchError={null} />;
}
