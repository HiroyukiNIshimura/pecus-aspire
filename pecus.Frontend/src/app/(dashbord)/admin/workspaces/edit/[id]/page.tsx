import { notFound, redirect } from "next/navigation";
import { getWorkspaceDetail } from "@/actions/admin/workspace";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { MasterGenreResponse, UserResponse } from "@/connectors/api/pecus";
import type { UserInfo } from "@/types/userInfo";
import EditWorkspaceClient from "./EditWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function EditWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspaceId = parseInt(id, 10);

  if (isNaN(workspaceId) || workspaceId <= 0) {
    notFound();
  }

  let userResponse: UserResponse | null = null;
  let workspaceDetail = null;
  let genres: MasterGenreResponse[] = [];
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // ワークスペース詳細を取得
    const workspaceResult = await getWorkspaceDetail(workspaceId);
    if (workspaceResult.success) {
      workspaceDetail = workspaceResult.data;
    } else {
      fetchError = workspaceResult.error;
    }

    // ジャンル一覧を取得
    if (!fetchError) {
      const genresResponse = await api.master.getApiMasterGenres();
      genres = genresResponse || [];
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

  if (!workspaceDetail) {
    notFound();
  }

  return (
    <EditWorkspaceClient
      initialUser={user}
      workspaceDetail={workspaceDetail}
      genres={genres}
      fetchError={fetchError}
    />
  );
}
