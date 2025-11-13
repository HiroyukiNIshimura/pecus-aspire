import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse } from "@/connectors/api/pecus";
import { redirect } from "next/navigation";
import type { UserInfo } from "@/types/userInfo";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function Dashboard() {
  let userResponse: UserResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();
  } catch (error: any) {
    console.error("Dashboard: failed to fetch user", error);

    // 認証エラーの場合はサインインページへリダイレクト
    if (error.status === 401) {
      redirect("/signin");
    }

    fetchError = error.body?.message || error.message || "ユーザー情報の取得に失敗しました";
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

  return <DashboardClient initialUser={user} fetchError={fetchError} />;
}
