import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminPage() {
  const api = createPecusApiClients();
  const result = await handleServerFetch(() => api.adminOrganization.getApiAdminOrganization());

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
    return <FetchError message={result.message} backUrl="/admin" backLabel="管理画面に戻る" />;
  }

  return <AdminClient initialOrganization={result.data} fetchError={null} />;
}
