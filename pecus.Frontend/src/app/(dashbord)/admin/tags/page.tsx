import { redirect } from "next/navigation";
import { getTags } from "@/actions/admin/tags";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse } from "@/connectors/api/pecus";
import { mapUserResponseToUserInfo } from "@/utils/userMapper";
import AdminTagsClient from "./AdminTagsClient";

export const dynamic = "force-dynamic";

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminTags() {
  let tags: any[] = [];
  let totalCount: number = 0;
  let totalPages: number = 1;
  let statistics: any = null;
  let userResponse: UserResponse | null = null;
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // タグ情報を取得
    const tagsResult = await getTags(1, true);
    if (tagsResult.success) {
      const responseData = tagsResult.data;
      tags = responseData?.data ?? [];
      totalCount = responseData?.totalCount ?? 0;
      totalPages = responseData?.totalPages ?? 1;
      statistics = responseData?.summary ?? null;
    } else {
      fetchError = `タグ情報の取得に失敗しました (${tagsResult.error})`;
    }
  } catch (error: any) {
    console.error("AdminTags: failed to fetch data", error);

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
    <AdminTagsClient
      initialUser={user}
      initialTags={tags}
      initialTotalCount={totalCount}
      initialTotalPages={totalPages}
      initialStatistics={statistics}
      fetchError={fetchError}
    />
  );
}
