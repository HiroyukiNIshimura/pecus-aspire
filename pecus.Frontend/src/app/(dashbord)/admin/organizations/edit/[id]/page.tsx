import { notFound, redirect } from 'next/navigation';
import { getOrganizationDetail } from '@/actions/admin/organizations';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { UserResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import EditOrganizationClient from './EditOrganizationClient';

export const dynamic = 'force-dynamic';

export default async function EditOrganizationPage() {
  let userResponse: UserResponse | null = null;
  let organizationDetail = null;
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

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

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  if (!organizationDetail) {
    notFound();
  }

  return <EditOrganizationClient initialUser={user} organizationDetail={organizationDetail} fetchError={fetchError} />;
}
