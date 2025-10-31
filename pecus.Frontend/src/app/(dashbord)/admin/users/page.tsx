import AdminUsersClient from "./AdminUsersClient";
import { getUsers } from "@/actions/admin/user";
import { getCurrentUser } from "@/actions/profile";

export const dynamic = 'force-dynamic';

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
};

interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminUsers() {
  let users: User[] = [];
  let totalCount: number = 0;
  let totalPages: number = 1;
  let userInfo: UserInfo | null = null;
  let fetchError: string | null = null;

  try {
    // Server Actions を使用してデータ取得
    const [usersResult, userResult] = await Promise.all([
      getUsers(1),
      getCurrentUser(),
    ]);

    // ユーザー一覧の処理
    if (usersResult.success) {
      const responseData = usersResult.data;
      users = responseData?.data ?? [];
      totalCount = responseData?.totalCount ?? 0;
      totalPages = responseData?.totalPages ?? 1;
    } else {
      fetchError = `ユーザー情報の取得に失敗しました (${usersResult.error})`;
    }

    // 現在のユーザー情報の処理
    if (userResult.success) {
      const userData = userResult.data;
      const roles = userData.roles ?? [];
      userInfo = {
        id: userData.id,
        name: userData.username ?? null,
        email: userData.email ?? null,
        roles,
        isAdmin: roles.some((r: any) => (typeof r === 'string' ? r === 'Admin' : r?.name === 'Admin')),
      } as UserInfo;
    }
  } catch (err: any) {
    console.error('AdminUsers: failed to fetch users or user info', err);
    fetchError = `データの取得に失敗しました (${err.message ?? String(err)})`;
  }

  return (
    <AdminUsersClient
      initialUsers={users}
      initialTotalCount={totalCount}
      initialTotalPages={totalPages}
      initialUser={userInfo}
      fetchError={fetchError}
    />
  );
}