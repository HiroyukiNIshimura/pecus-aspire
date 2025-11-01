import AdminSkillsClient from "./AdminSkillsClient";
import { getCurrentUser } from "@/actions/profile";
import { getSkills } from "@/actions/admin/skills";

export const dynamic = 'force-dynamic';

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
};

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminSkills() {
  let skills: any[] = [];
  let totalCount: number = 0;
  let totalPages: number = 1;
  let statistics: any = null;
  let user: UserInfo | null = null;
  let fetchError: string | null = null;

  try {
    // Server Actions を使用してデータ取得
    // Middlewareが事前に認証チェックを行うため、ここでは401エラーは発生しない
    const [skillsResult, userResult] = await Promise.all([
      getSkills(1, true),
      getCurrentUser(),
    ]);

    // スキル情報の処理
    if (skillsResult.success) {
      const responseData = skillsResult.data;
      skills = responseData?.data ?? [];
      totalCount = responseData?.totalCount ?? 0;
      totalPages = responseData?.totalPages ?? 1;
      statistics = responseData?.summary ?? null;
    } else {
      fetchError = `スキル情報の取得に失敗しました (${skillsResult.error})`;
    }

    // ユーザー情報の処理
    if (userResult.success) {
      const userData = userResult.data;
      user = {
        id: userData.id,
        name: userData.username ?? null,
        email: userData.email ?? null,
        isAdmin: userData.isAdmin ?? false,
      } as UserInfo;
    }
  } catch (err: any) {
    console.error('AdminSkills: failed to fetch data', err);
    fetchError = `データの取得に失敗しました (${err.message ?? String(err)})`;
  }

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
