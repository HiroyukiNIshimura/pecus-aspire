export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse, WorkspaceFullDetailResponse } from "@/connectors/api/pecus";
import { mapUserResponseToUserInfo } from "@/utils/userMapper";
import WorkspaceDetailClient from "./WorkspaceDetailClient";
import type { UserInfo } from "@/types/userInfo";

interface WorkspaceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkspaceDetailPage({
  params,
}: WorkspaceDetailPageProps) {
  const { id } = await params;
  const workspaceId = parseInt(id, 10);

  // ユーザー情報取得
  let userInfo: UserInfo | null = null;
  let userResponse: UserResponse | null = null;
  let workspaceDetail: WorkspaceFullDetailResponse | null = null;

  try {
    const api = createPecusApiClients();
    userResponse = await api.profile.getApiProfile();
    userInfo = mapUserResponseToUserInfo(userResponse);

    // ワークスペース詳細情報取得
    workspaceDetail = await api.workspace.getApiWorkspaces1(workspaceId);
  } catch (error: any) {
    console.error("WorkspaceDetailPage: failed to fetch data", error);

    // 認証エラーの場合はサインインページへリダイレクト
    if (error.status === 401) {
      redirect("/signin");
    }

    // ワークスペースが見つからない場合は一覧ページへリダイレクト
    if (error.status === 404) {
      redirect("/workspaces");
    }
  }

  // ユーザー情報が取得できない場合はリダイレクト
  if (!userInfo) {
    redirect("/signin");
  }

  // ワークスペース情報が取得できない場合はリダイレクト
  if (!workspaceDetail) {
    redirect("/workspaces");
  }

  return (
    <WorkspaceDetailClient
      workspaceId={id}
      workspaceDetail={workspaceDetail}
      userInfo={userInfo}
    />
  );
}
