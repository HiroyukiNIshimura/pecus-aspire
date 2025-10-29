import AdminClient from "./AdminClient";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { refreshAccessToken } from "@/connectors/api/auth";
import { SessionManager } from "@/libs/session";

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
    const session = await SessionManager.getSession();
    if (session && session.user) {
      const roles = session.user.roles ?? [];
      user = {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        roles,
        isAdmin: roles.some((r: any) => (typeof r === 'string' ? r === 'Admin' : r?.name === 'Admin')),
      } as UserInfo;
    }

    const clients = createPecusApiClients();
    const res = await clients.adminOrganization.apiAdminOrganizationGet();
    organization = (res?.data ?? res) as OrganizationData;
  } catch (err: any) {
    console.error('AdminPage: failed to fetch organization or user', err);
    const status = err?.response?.status;
    const detail = err?.message ?? String(err);

    // 401エラーの場合、リフレッシュを試行
    if (status === 401) {
      console.log('AdminPage: 401 error detected, attempting token refresh');
      try {
        await refreshAccessToken();
        console.log('AdminPage: Token refresh successful, retrying API call');

        // リフレッシュ成功したらAPIを再試行
        const clients = createPecusApiClients();
        const res = await clients.adminOrganization.apiAdminOrganizationGet();
        organization = (res?.data ?? res) as OrganizationData;
        console.log('AdminPage: Retry successful');
      } catch (refreshErr: any) {
        console.error('AdminPage: Token refresh failed:', refreshErr);
        fetchError = '認証が切れました。再度ログインしてください。';
      }
    } else {
      fetchError = `組織情報の取得に失敗しました (${detail})`;
    }
  }

  return (
    <AdminClient
      initialOrganization={organization}
      initialUser={user}
      fetchError={fetchError}
    />
  );
}
