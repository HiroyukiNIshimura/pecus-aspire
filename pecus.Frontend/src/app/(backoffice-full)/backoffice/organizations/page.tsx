import { redirect } from 'next/navigation';
import { getBackOfficeOrganizations } from '@/actions/backoffice/organizations';
import type { PagedResponseOfBackOfficeOrganizationListItemResponse } from '@/connectors/api/pecus';
import OrganizationsClient from './OrganizationsClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page ? Number.parseInt(params.page, 10) : 1;

  let data: PagedResponseOfBackOfficeOrganizationListItemResponse | null = null;
  let fetchError: string | null = null;

  const result = await getBackOfficeOrganizations(page, 20);

  if (result.success) {
    data = result.data;
  } else {
    if (result.error === 'forbidden') {
      redirect('/');
    }
    fetchError = JSON.stringify({ message: result.message, code: result.error });
  }

  return <OrganizationsClient initialData={data} fetchError={fetchError} />;
}
