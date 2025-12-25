import { redirect } from 'next/navigation';
import { getOrganizationDetail } from '@/actions/admin/organizations';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { OrganizationResponse } from '@/connectors/api/pecus';
import AdminSettingsClient from './AdminSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  let organization: OrganizationResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // 認証チェック（プロフィール取得）
    await api.profile.getApiProfile();

    // 組織情報（設定を含む）を取得
    const organizationResult = await getOrganizationDetail();
    if (organizationResult.success) {
      organization = organizationResult.data;
    } else {
      fetchError = organizationResult.message || organizationResult.error || '組織情報の取得に失敗しました。';
    }
  } catch (error) {
    const noAuthError = detect401ValidationError(error);
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得に失敗しました。').message;
  }

  if (!organization) {
    redirect('/admin');
  }

  return <AdminSettingsClient organization={organization} fetchError={fetchError} />;
}
