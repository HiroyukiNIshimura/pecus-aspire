import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError } from '@/connectors/api/PecusApiClient';
import type { UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import AdminUsersClient from './AdminUsersClient';

export const dynamic = 'force-dynamic';

/**
 * ユーザー管理ページ（SSR）
 *
 * NOTE: ユーザー一覧データはClient側でフェッチする
 * （SSRでHTMLレンダリングしないデータをSSRでフェッチしない方針）
 */
export default async function AdminUsers() {
  let userResponse: UserDetailResponse | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得（認証チェック）
    userResponse = await api.profile.getApiProfile();
  } catch (error) {
    console.error('AdminUsers: failed to fetch user', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }
  }

  // ユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserDetailResponse から UserInfo に変換
  const userInfo = mapUserResponseToUserInfo(userResponse);

  return <AdminUsersClient initialUser={userInfo} />;
}
