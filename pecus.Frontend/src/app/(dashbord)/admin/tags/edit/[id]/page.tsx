import { notFound, redirect } from "next/navigation";
import { getTagDetail } from "@/actions/admin/tags";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse } from "@/connectors/api/pecus";
import type { UserInfo } from "@/types/userInfo";
import EditTagClient from "./EditTagClient";

export const dynamic = "force-dynamic";

export default async function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tagId = parseInt(id, 10);

  if (isNaN(tagId) || tagId <= 0) {
    notFound();
  }

  let userResponse: UserResponse | null = null;
  let tagDetail = null;
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    const tagResult = await getTagDetail(tagId);
    if (tagResult.success) {
      tagDetail = tagResult.data;
    } else {
      fetchError = tagResult.error;
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

  if (!tagDetail) {
    notFound();
  }

  return (
    <EditTagClient
      initialUser={user}
      tagDetail={tagDetail}
      fetchError={fetchError}
    />
  );
}
