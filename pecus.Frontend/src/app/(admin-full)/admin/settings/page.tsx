import { redirect } from 'next/navigation';
import { getOrganizationDetail } from '@/actions/admin/organizations';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import AdminSettingsClient from './AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const api = createPecusApiClients();
  const authResult = await handleServerFetch(() => api.profile.getApiProfile());

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
    redirect('/admin');
  }

  return <AdminSettingsClient organization={organizationResult.data} fetchError={null} />;
}
