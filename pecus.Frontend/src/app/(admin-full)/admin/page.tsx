import { redirect } from 'next/navigation';
import {
  createPecusApiClients,
  detect401ValidationError,
  getUserSafeErrorMessage,
} from '@/connectors/api/PecusApiClient';
import type { OrganizationResponse } from '@/connectors/api/pecus';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminPage() {
  let organization: OrganizationResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // 組織情報を取得
    organization = await api.adminOrganization.getApiAdminOrganization();
  } catch (error) {
    console.error('AdminPage: failed to fetch organization', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = getUserSafeErrorMessage(error, 'データの取得に失敗しました');
  }

  return <AdminClient initialOrganization={organization} fetchError={fetchError} />;
}
