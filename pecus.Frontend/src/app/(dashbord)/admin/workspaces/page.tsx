import AdminWorkspacesClient from "./AdminWorkspacesClient";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { SessionManager } from "@/libs/session";
import { WorkspaceListItemResponse } from '@/connectors/api/pecus';

export const dynamic = 'force-dynamic';

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
};

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminWorkspaces() {
  let workspaces: WorkspaceListItemResponse[] = [];
  let totalCount: number = 0;
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
    const res = await clients.adminWorkspace.apiAdminWorkspacesGet({ page: 1, activeOnly: true });
    const responseData = res?.data ?? res;
    workspaces = responseData?.data ?? [];
    totalCount = responseData?.totalCount ?? 0;
  } catch (err: any) {
    console.error('AdminWorkspaces: failed to fetch workspaces or user', err);
    const status = err?.response?.status;
    const detail = err?.message ?? String(err);

    fetchError = `ワークスペース情報の取得に失敗しました (${detail})`;
  }

  return (
    <AdminWorkspacesClient
      initialWorkspaces={workspaces}
      initialTotalCount={totalCount}
      initialUser={user}
      fetchError={fetchError}
    />
  );
}