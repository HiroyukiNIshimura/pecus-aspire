import { redirect } from 'next/navigation';
import { getBackOfficeNotificationDetail } from '@/actions/backoffice/notifications';
import type { BackOfficeNotificationDetailResponse } from '@/connectors/api/pecus';
import NotificationDetailClient from './NotificationDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NotificationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const notificationId = Number.parseInt(id, 10);

  let data: BackOfficeNotificationDetailResponse | null = null;
  let fetchError: string | null = null;

  const result = await getBackOfficeNotificationDetail(notificationId);

  if (result.success) {
    data = result.data;
  } else {
    if (result.error === 'forbidden') {
      redirect('/');
    }
    if (result.error === 'not_found') {
      redirect('/backoffice/notifications');
    }
    fetchError = JSON.stringify({ message: result.message, code: result.error });
  }

  return <NotificationDetailClient initialData={data} fetchError={fetchError} />;
}
