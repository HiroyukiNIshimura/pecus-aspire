import { getBackOfficeOrganizations } from '@/actions/backoffice/organizations';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import OrganizationsClient from './OrganizationsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  const result = await getBackOfficeOrganizations(page, 20);

  if (!result.success) {
    if (result.error === 'forbidden') {
      return <ForbiddenError backUrl="/backoffice" backLabel="BackOfficeダッシュボードに戻る" />;
    }
    return <FetchError message={result.message} backUrl="/backoffice" backLabel="BackOfficeダッシュボードに戻る" />;
  }

  return <OrganizationsClient initialData={result.data} fetchError={null} />;
}
