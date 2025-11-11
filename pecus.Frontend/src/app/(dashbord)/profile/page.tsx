import { getCurrentUser } from "@/actions/profile";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse, MasterSkillResponse } from "@/connectors/api/pecus";
import { redirect } from "next/navigation";
import ProfileSettingsClient from "./ProfileSettingsClient";

export const dynamic = "force-dynamic";

/**
 * ユーザープロフィール設定ページ（Server Component）
 * SSR で初期データを取得し、Client Component へプロップスで渡す
 */
export default async function ProfileSettingsPage() {
  let user: UserResponse | null = null;
  let masterSkills: MasterSkillResponse[] = [];
  let fetchError: string | null = null;

  try {
    // Server Action でユーザー情報を取得
    const userResult = await getCurrentUser();

    if (userResult.success) {
      // UserInfo から UserResponse への拡張データ取得が必要な場合
      // 最新のプロフィール情報（rowVersion含む）を取得
      const api = createPecusApiClients();
      user = await api.profile.getApiProfile();
    } else {
      fetchError = `ユーザー情報の取得に失敗しました: ${userResult.message}`;
    }

    // API クライアント経由でマスタスキルを取得
    try {
      const api = createPecusApiClients();
      masterSkills = await api.master.getApiMasterSkills();
    } catch (error: any) {
      console.error("Failed to fetch master skills:", error);
      fetchError = `スキル情報の取得に失敗しました`;
    }
  } catch (error: any) {
    console.error("Failed to fetch profile data:", error);
    fetchError = "プロフィール情報の取得に失敗しました";
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!user) {
    redirect("/signin");
  }

  return (
    <ProfileSettingsClient
      initialUser={user}
      masterSkills={masterSkills}
      fetchError={fetchError}
    />
  );
}
