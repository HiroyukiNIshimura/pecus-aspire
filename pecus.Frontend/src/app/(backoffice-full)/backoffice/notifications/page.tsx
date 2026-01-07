import { getBackOfficeNotifications } from '@/actions/backoffice/notifications';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import type { PagedResponseOfBackOfficeNotificationListItemResponse } from '@/connectors/api/pecus';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ page?: string; includeDeleted?: string }>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;
  const includeDeleted = params.includeDeleted === 'true';

  const result = await getBackOfficeNotifications(page, 20, includeDeleted);

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/backoffice" backLabel="BackOfficeダッシュボードに戻る" />;
    }
    return <FetchError message={result.message} backUrl="/backoffice" backLabel="BackOfficeダッシュボードに戻る" />;
  }

  return <NotificationsClient initialData={result.data} fetchError={null} />;
}
