import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse, MasterSkillResponse, PendingEmailChangeResponse } from "@/connectors/api/pecus";
import { redirect } from "next/navigation";
import { mapUserResponseToUserInfo } from "@/utils/userMapper";
import ProfileSettingsClient from "./ProfileSettingsClient";

export const dynamic = "force-dynamic";

/**
 * ユーザープロフィール設定ページ（Server Component）
 * SSR で初期データを取得し、Client Component へプロップスで渡す
 */
export default async function ProfileSettingsPage() {
  let userResponse: UserResponse | null = null;
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
    } catch (error: any) {
      console.error("Failed to fetch master skills:", error);
      fetchError = `スキル情報の取得に失敗しました`;
    }

    // 保留中のメールアドレス変更を取得
    try {
      pendingEmailChange = await api.profileEmail.getApiProfileEmailPending();
    } catch (error: any) {
      // 204 No Content は正常（保留なし）
      if (error.status !== 204) {
        console.warn("Failed to fetch pending email change:", error);
      }
    }
  } catch (error: any) {
    console.error("Failed to fetch profile data:", error);

    // 認証エラーの場合はサインインページへリダイレクト
    if (error.status === 401) {
      redirect("/signin");
    }

    fetchError = error.body?.message || error.message || "プロフィール情報の取得に失敗しました";
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect("/signin");
  }

  // UserResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return (
    <ProfileSettingsClient
      initialUser={user}
      initialPendingEmailChange={pendingEmailChange}
      masterSkills={masterSkills}
      fetchError={fetchError}
    />
  );
}
