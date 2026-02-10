import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import AdminApiKeysClient from './AdminApiKeysClient';

export const dynamic = 'force-dynamic';

export default async function AdminApiKeysPage() {
  const api = createPecusApiClients();
  const result = await handleServerFetch(() => api.adminExternalApiKeys.getApiAdminExternalApiKeys());

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
    return <FetchError message={result.message} backUrl="/admin" backLabel="管理画面に戻る" />;
  }

  return <AdminApiKeysClient initialKeys={result.data} />;
}
