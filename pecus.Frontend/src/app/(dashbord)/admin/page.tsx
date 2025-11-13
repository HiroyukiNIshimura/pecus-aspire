import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { OrganizationResponse, UserResponse } from "@/connectors/api/pecus";
import { redirect } from "next/navigation";
import type { UserInfo } from "@/types/userInfo";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminPage() {
  let organization: OrganizationResponse | null = null;
  let userResponse: UserResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // 組織情報を取得
    organization = await api.adminOrganization.getApiAdminOrganization();
  } catch (error: any) {
    console.error("AdminPage: failed to fetch organization or user", error);

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
  const user: UserInfo = {
    id: userResponse.id,
    name: userResponse.username ?? null,
    email: userResponse.email ?? null,
    roles: userResponse.roles ?? [],
    isAdmin: userResponse.isAdmin ?? false,
  };

  return (
    <AdminClient
      initialOrganization={organization}
      initialUser={user}
      fetchError={fetchError}
    />
  );
}
