import { redirect } from 'next/navigation';
import { getBackOfficeOrganizationDetail } from '@/actions/backoffice/organizations';
import type { BackOfficeOrganizationDetailResponse } from '@/connectors/api/pecus';
import OrganizationDetailClient from './OrganizationDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const organizationId = Number.parseInt(id, 10);

  let data: BackOfficeOrganizationDetailResponse | null = null;
  let fetchError: string | null = null;

  const result = await getBackOfficeOrganizationDetail(organizationId);

  if (result.success) {
    data = result.data;
  } else {
    if (result.error === 'forbidden') {
      redirect('/');
    }
    if (result.error === 'not_found') {
      redirect('/backoffice/organizations');
    }
    fetchError = JSON.stringify({ message: result.message, code: result.error });
  }

  return <OrganizationDetailClient initialData={data} fetchError={fetchError} />;
}
