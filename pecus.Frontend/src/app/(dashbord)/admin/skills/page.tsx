import AdminSkillsClient from "./AdminSkillsClient";
import { getCurrentUser } from "@/actions/profile";
import { getSkills } from "@/actions/admin/skills";

export const dynamic = 'force-dynamic';

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminSkills() {
  let user: any = null;
  let skills: any[] = [];
  let fetchError: string | null = null;

  try {
    // ユーザー情報を取得
    const userResult = await getCurrentUser();

    if (userResult.success) {
      const userData = userResult.data;
      const roles = userData.roles ?? [];
      user = {
        id: userData.id,
        name: userData.username ?? null,
        email: userData.email ?? null,
        roles,
        isAdmin: roles.some((r: any) => (typeof r === 'string' ? r === 'Admin' : r?.name === 'Admin')),
      };
    } else {
      fetchError = `ユーザー情報の取得に失敗しました (${userResult.error})`;
    }

    // スキル一覧を取得
    const skillsResult = await getSkills(1, true);
    if (skillsResult.success) {
      skills = skillsResult.data?.data ?? [];
    } else {
      fetchError = `スキル一覧の取得に失敗しました (${skillsResult.error})`;
    }
  } catch (err: any) {
    console.error('AdminSkills: failed to fetch data', err);
    fetchError = `データの取得に失敗しました (${err.message ?? String(err)})`;
  }

  return (
    <AdminSkillsClient
      initialUser={user}
      initialSkills={skills}
      fetchError={fetchError}
    />
  );
}
