import AdminClient from "./AdminClient";
import { getOrganization } from "@/actions/admin/organization";
import { getCurrentUser } from "@/actions/profile";

export const dynamic = 'force-dynamic';

type OrganizationData = {
  id?: number | string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  representativeName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isActive?: boolean;
  userCount?: number | null;
};

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
};

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminPage() {
  let organization: OrganizationData | null = null;
  let user: UserInfo | null = null;
  let fetchError: string | null = null;

  try {
    // Server Actions を使用してデータ取得
    // Middlewareが事前に認証チェックを行うため、ここでは401エラーは発生しない
    const [orgResult, userResult] = await Promise.all([
      getOrganization(),
      getCurrentUser(),
    ]);

    // 組織情報の処理
    if (orgResult.success) {
      organization = orgResult.data as OrganizationData;
    } else {
      fetchError = `組織情報の取得に失敗しました (${orgResult.error})`;
    }

    // ユーザー情報の処理
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
    }
  } catch (err: any) {
    console.error('AdminPage: failed to fetch organization or user', err);
    fetchError = `データの取得に失敗しました (${err.message ?? String(err)})`;
  }

  return (
    <AdminClient
      initialOrganization={organization}
      initialUser={user}
      fetchError={fetchError}
    />
  );
}
