import DashboardClient from "./DashboardClient";
import { getCurrentUser } from "@/actions/profile";

export const dynamic = 'force-dynamic';

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
};

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function Dashboard() {
  let user: UserInfo | null = null;
  let fetchError: string | null = null;

  try {
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
      } as UserInfo;
    } else {
      fetchError = `ユーザー情報の取得に失敗しました (${userResult.error})`;
    }
  } catch (err: any) {
    console.error('Dashboard: failed to fetch user', err);
    fetchError = `データの取得に失敗しました (${err.message ?? String(err)})`;
  }

  return (
    <DashboardClient
      initialUser={user}
      fetchError={fetchError}
    />
  );
}
