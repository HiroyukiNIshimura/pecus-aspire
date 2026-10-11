import { notFound } from 'next/navigation';
import { getOrganizationDetail } from '@/actions/admin/organizations';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { getProfileWithHeyApi } from '@/connectors/HeyApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import EditOrganizationClient from './EditOrganizationClient';

export const dynamic = 'force-dynamic';

export default async function EditOrganizationPage() {
  const authResult = await handleServerFetch(getProfileWithHeyApi);

  if (!authResult.success) {
    if (authResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
    return <FetchError message={authResult.message} backUrl="/admin" backLabel="管理画面に戻る" />;
  }

  const organizationResult = await getOrganizationDetail();
  if (!organizationResult.success) {
    if (organizationResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
    if (organizationResult.error === 'not_found') {
      notFound();
    }
    return <FetchError message={organizationResult.message} backUrl="/admin" backLabel="管理画面に戻る" />;
  }

  return <EditOrganizationClient organizationDetail={organizationResult.data} fetchError={null} />;
}
