import { redirect } from 'next/navigation';
import { getBackOfficeNotifications } from '@/actions/backoffice/notifications';
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

  let data: PagedResponseOfBackOfficeNotificationListItemResponse | null = null;
  let fetchError: string | null = null;

  const result = await getBackOfficeNotifications(page, 20, includeDeleted);

  if (result.success) {
    data = result.data;
  } else {
    if (result.error === 'forbidden') {
      redirect('/');
    }
    fetchError = JSON.stringify({ message: result.message, code: result.error });
  }

  return <NotificationsClient initialData={data} fetchError={fetchError} />;
}
