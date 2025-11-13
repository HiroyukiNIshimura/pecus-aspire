import { notFound, redirect } from "next/navigation";
import { getOrganizationDetail } from "@/actions/admin/organizations";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse } from "@/connectors/api/pecus";
import type { UserInfo } from "@/types/userInfo";
import EditOrganizationClient from "./EditOrganizationClient";

export const dynamic = "force-dynamic";

export default async function EditOrganizationPage() {
  let userResponse: UserResponse | null = null;
  let organizationDetail = null;
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    const organizationResult = await getOrganizationDetail();
    if (organizationResult.success) {
      organizationDetail = organizationResult.data;
    } else {
      fetchError = organizationResult.error;
    }
  } catch (error: any) {
    // 認証エラーの場合はサインインページへリダイレクト
    if (error.status === 401) {
      redirect("/signin");
    }

    fetchError = error.body?.message || error.message || "データの取得中にエラーが発生しました。";
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

  if (!organizationDetail) {
    notFound();
  }

  return (
    <EditOrganizationClient
      initialUser={user}
      organizationDetail={organizationDetail}
      fetchError={fetchError}
    />
  );
}
