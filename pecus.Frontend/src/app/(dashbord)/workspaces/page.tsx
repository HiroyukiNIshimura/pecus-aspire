import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse } from "@/connectors/api/pecus";
import { redirect } from "next/navigation";
import { mapUserResponseToUserInfo } from "@/utils/userMapper";
import WorkspacesClient from "./WorkspacesClient";

export const dynamic = "force-dynamic";

/**
 * ワークスペース一覧ページ（SSR）
 * ログインユーザーがアクセス可能なワークスペースを表示
 */
export default async function WorkspacesPage() {
  let userResponse: UserResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();
  } catch (error: any) {
    console.error("WorkspacesPage: failed to fetch user", error);

    // 認証エラーの場合はサインインページへリダイレクト
    if (error.status === 401) {
      redirect("/signin");
    }

    fetchError =
      error.body?.message ||
      error.message ||
      "ユーザー情報の取得に失敗しました";
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect("/signin");
  }

  // UserResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return <WorkspacesClient initialUser={user} fetchError={fetchError} />;
}
