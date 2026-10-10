import { redirect } from 'next/navigation';
import {
  getMasterSkillsWithHeyApi,
  getPendingEmailChangeWithHeyApi,
  getProfileWithHeyApi,
} from '@/connectors/HeyApiClient';
import type {
  GetApiProfileResponse,
  MasterSkillResponse,
  PendingEmailChangeResponse,
} from '@/connectors/hey-api-axios/types.gen';
import { detect401ValidationError, getUserSafeErrorMessage } from '@/libs/apiError';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

/**
 * ユーザープロフィール設定ページ（Server Component）
 * SSR で初期データを取得し、Client Component へプロップスで渡す
 */
export default async function ProfileSettingsPage() {
  let userResponse: GetApiProfileResponse | null = null;
  let masterSkills: MasterSkillResponse[] = [];
  let pendingEmailChange: PendingEmailChangeResponse | null = null;
  let fetchError: string | null = null;

  try {
    // ユーザー情報を取得
    userResponse = await getProfileWithHeyApi();

    // マスタスキルを取得
    try {
      masterSkills = await getMasterSkillsWithHeyApi();
    } catch (error) {
      console.error('Failed to fetch master skills:', error);
      fetchError = `スキル情報の取得に失敗しました`;
    }

    // 保留中のメールアドレス変更を取得
    pendingEmailChange = await getPendingEmailChangeWithHeyApi();
  } catch (error) {
    console.error('Failed to fetch profile data:', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = getUserSafeErrorMessage(error, 'プロフィール情報の取得に失敗しました');
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserDetailResponse から UserInfo に変換
  const { setting: _setting, ...userProfile } = userResponse;
  const user = mapUserResponseToUserInfo({
    ...userProfile,
    avatarType: userProfile.avatarType ?? undefined,
  });

  return (
    <ProfileClient
      initialUser={user}
      initialPendingEmailChange={pendingEmailChange}
      masterSkills={masterSkills}
      fetchError={fetchError}
    />
  );
}
