import { notFound } from "next/navigation";
import { getWorkspaceDetail } from "@/actions/admin/workspace";
import { getCurrentUser } from "@/actions/profile";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { MasterGenreResponse } from "@/connectors/api/pecus";
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

  let user: UserInfo | null = null;
  let workspaceDetail = null;
  let genres: MasterGenreResponse[] = [];
  let fetchError = null;

  try {
    // ユーザー情報を取得
    const userResult = await getCurrentUser();
    if (userResult.success && userResult.data) {
      user = userResult.data;
    }

    // ワークスペース詳細を取得
    const workspaceResult = await getWorkspaceDetail(workspaceId);
    if (workspaceResult.success) {
      workspaceDetail = workspaceResult.data;
    } else {
      fetchError = workspaceResult.error;
    }

    // ジャンル一覧を取得
    if (!fetchError) {
      const api = createPecusApiClients();
      const genresResponse = await api.masterData.getApiMasterGenres();
      genres = genresResponse || [];
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      fetchError = err.message;
    } else {
      fetchError = "データの取得中にエラーが発生しました。";
    }
  }

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
