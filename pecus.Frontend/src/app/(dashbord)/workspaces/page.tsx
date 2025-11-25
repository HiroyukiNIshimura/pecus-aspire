import { redirect } from "next/navigation";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { MasterGenreResponse, UserResponse } from "@/connectors/api/pecus";
import { mapUserResponseToUserInfo } from "@/utils/userMapper";
import WorkspacesClient from "./WorkspacesClient";

export const dynamic = "force-dynamic";

/**
 * ワークスペース一覧ページ（SSR）
 * ログインユーザーがアクセス可能なワークスペースを表示
 */
export default async function WorkspacesPage() {
  let userResponse: UserResponse | null = null;
  let genres: MasterGenreResponse[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報とジャンル一覧を並行取得
    [userResponse, genres] = await Promise.all([
      api.profile.getApiProfile(),
      api.master.getApiMasterGenres(),
    ]);
  } catch (error: any) {
    console.error("WorkspacesPage: failed to fetch data", error);

    // 認証エラーの場合はサインインページへリダイレクト
    if (error.status === 401) {
      redirect("/signin");
    }

    fetchError =
      error.body?.message || error.message || "データの取得に失敗しました";
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect("/signin");
  }

  // UserResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

  return (
    <WorkspacesClient
      initialUser={user}
      fetchError={fetchError}
      genres={genres}
    />
  );
}
