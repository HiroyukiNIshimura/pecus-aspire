import { getSkills } from "@/actions/admin/skills";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse } from "@/connectors/api/pecus";
import { redirect } from "next/navigation";
import { mapUserResponseToUserInfo } from "@/utils/userMapper";
import AdminSkillsClient from "./AdminSkillsClient";

export const dynamic = "force-dynamic";

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminSkills() {
  let skills: any[] = [];
  let totalCount: number = 0;
  let totalPages: number = 1;
  let statistics: any = null;
  let userResponse: UserResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // スキル情報を取得
    const skillsResult = await getSkills(1, true);
    if (skillsResult.success) {
      const responseData = skillsResult.data;
      skills = responseData?.data ?? [];
      totalCount = responseData?.totalCount ?? 0;
      totalPages = responseData?.totalPages ?? 1;
      statistics = responseData?.summary ?? null;
    } else {
      fetchError = `スキル情報の取得に失敗しました (${skillsResult.error})`;
    }
  } catch (error: any) {
    console.error("AdminSkills: failed to fetch data", error);

    // 認証エラーの場合はサインインページへリダイレクト
    if (error.status === 401) {
      redirect("/signin");
    }

    fetchError = error.body?.message || error.message || "データの取得に失敗しました";
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect("/signin");
  }

  // UserResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return (
    <AdminSkillsClient
      initialUser={user}
      initialSkills={skills}
      initialTotalCount={totalCount}
      initialTotalPages={totalPages}
      initialStatistics={statistics}
      fetchError={fetchError}
    />
  );
}
