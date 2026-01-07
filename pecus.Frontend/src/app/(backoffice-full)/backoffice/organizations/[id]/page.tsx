import { notFound } from 'next/navigation';
import { getBackOfficeOrganizationDetail } from '@/actions/backoffice/organizations';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import OrganizationDetailClient from './OrganizationDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const organizationId = Number.parseInt(id, 10);

  const result = await getBackOfficeOrganizationDetail(organizationId);

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/backoffice/organizations" backLabel="組織一覧に戻る" />;
    }
    if (result.error === 'not_found') {
      notFound();
    }
    return <FetchError message={result.message} backUrl="/backoffice/organizations" backLabel="組織一覧に戻る" />;
  }

  return <OrganizationDetailClient initialData={result.data} fetchError={null} />;
}
