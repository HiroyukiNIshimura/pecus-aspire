import { notFound, redirect } from 'next/navigation';
import { getOrganizationDetail } from '@/actions/admin/organizations';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import EditOrganizationClient from './EditOrganizationClient';

export const dynamic = 'force-dynamic';

export default async function EditOrganizationPage() {
  let organizationDetail = null;
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // 認証チェック（プロフィール取得）
    await api.profile.getApiProfile();

    const organizationResult = await getOrganizationDetail();
    if (organizationResult.success) {
      organizationDetail = organizationResult.data;
    } else {
      fetchError = organizationResult.error;
    }
  } catch (error) {
    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得中にエラーが発生しました。').message;
  }

  if (!organizationDetail) {
    notFound();
  }

  return <EditOrganizationClient organizationDetail={organizationDetail} fetchError={fetchError} />;
}
