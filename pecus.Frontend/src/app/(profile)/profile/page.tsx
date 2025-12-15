import { redirect } from 'next/navigation';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { MasterSkillResponse, PendingEmailChangeResponse, UserDetailResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

/**
 * ユーザープロフィール設定ページ（Server Component）
 * SSR で初期データを取得し、Client Component へプロップスで渡す
 */
export default async function ProfileSettingsPage() {
  let userResponse: UserDetailResponse | null = null;
  let masterSkills: MasterSkillResponse[] = [];
  let pendingEmailChange: PendingEmailChangeResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // マスタスキルを取得
    try {
      masterSkills = await api.master.getApiMasterSkills();
    } catch (error) {
      console.error('Failed to fetch master skills:', error);
      fetchError = `スキル情報の取得に失敗しました`;
    }

    // 保留中のメールアドレス変更を取得
    pendingEmailChange = await api.profile.getApiProfileEmailPending();
  } catch (error) {
    console.error('Failed to fetch profile data:', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'プロフィール情報の取得に失敗しました').message;
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserDetailResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return (
    <ProfileClient
      initialUser={user}
      initialPendingEmailChange={pendingEmailChange}
      masterSkills={masterSkills}
      fetchError={fetchError}
    />
  );
}
