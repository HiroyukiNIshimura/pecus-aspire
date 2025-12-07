import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import UserSettingsClient from './UserSettingsClient';

export const dynamic = 'force-dynamic';

/**
 * ユーザー設定ページ（Server Component）
 * SSR で初期データを取得し、Client Component へプロップスで渡す
 */
export default async function UserSettingsPage() {
  let userResponse: UserDetailResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();
  } catch (error) {
    console.error('Failed to fetch user settings data:', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'ユーザー設定情報の取得に失敗しました').message;
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserDetailResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return <UserSettingsClient initialUser={user} initialSettings={userResponse.setting} fetchError={fetchError} />;
}
