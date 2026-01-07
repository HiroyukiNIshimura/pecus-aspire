import { notFound } from 'next/navigation';
import { getBackOfficeNotificationDetail } from '@/actions/backoffice/notifications';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import NotificationDetailClient from './NotificationDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NotificationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const notificationId = Number.parseInt(id, 10);

  const result = await getBackOfficeNotificationDetail(notificationId);

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/backoffice/notifications" backLabel="お知らせ一覧に戻る" />;
    }
    if (result.error === 'not_found') {
      notFound();
    }
    return <FetchError message={result.message} backUrl="/backoffice/notifications" backLabel="お知らせ一覧に戻る" />;
  }

  return <NotificationDetailClient initialData={result.data} fetchError={null} />;
}
