import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { getAdminOrganizationWithHeyApi } from '@/connectors/HeyApiClient';
import { handleServerFetch } from '@/libs/serverFetch';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminPage() {
  const result = await handleServerFetch(getAdminOrganizationWithHeyApi);

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/" backLabel="ダッシュボードに戻る" />;
    }
    return <FetchError message={result.message} backUrl="/admin" backLabel="管理画面に戻る" />;
  }

  return <AdminClient initialOrganization={result.data} fetchError={null} />;
}
