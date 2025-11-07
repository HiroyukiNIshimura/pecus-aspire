import AdminTagsClient from "./AdminTagsClient";
import { getCurrentUser } from "@/actions/profile";
import { getTags } from "@/actions/admin/tags";
import { UserInfo } from "@/types/userInfo";

export const dynamic = "force-dynamic";

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminTags() {
  let tags: any[] = [];
  let totalCount: number = 0;
  let totalPages: number = 1;
  let statistics: any = null;
  let user: UserInfo | null = null;
  let fetchError: string | null = null;

  try {
    // Server Actions を使用してデータ取得
    // Middlewareが事前に認証チェックを行うため、ここでは401エラーは発生しない
    const [tagsResult, userResult] = await Promise.all([
      getTags(1, true),
      getCurrentUser(),
    ]);

    // タグ情報の処理
    if (tagsResult.success) {
      const responseData = tagsResult.data;
      tags = responseData?.data ?? [];
      totalCount = responseData?.totalCount ?? 0;
      totalPages = responseData?.totalPages ?? 1;
      statistics = responseData?.summary ?? null;
    } else {
      fetchError = `タグ情報の取得に失敗しました (${tagsResult.error})`;
    }

    // ユーザー情報の処理
    if (userResult.success) {
      const userData = userResult.data;
      user = {
        id: userData.id,
        name: userData.name ?? null,
        email: userData.email ?? null,
        isAdmin: userData.isAdmin ?? false,
      } as UserInfo;
    }
  } catch (err: any) {
    console.error("AdminTags: failed to fetch data", err);
    fetchError = `データの取得に失敗しました (${err.message ?? String(err)})`;
  }

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
