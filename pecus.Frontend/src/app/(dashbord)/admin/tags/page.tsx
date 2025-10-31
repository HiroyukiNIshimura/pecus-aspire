import AdminTagsClient from "./AdminTagsClient";
import { getCurrentUser } from "@/actions/profile";
import { getTags } from "@/actions/admin/tags";

export const dynamic = 'force-dynamic';

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminTags() {
  let user: any = null;
  let tags: any[] = [];
  let fetchError: string | null = null;

  try {
    // ユーザー情報を取得
    const userResult = await getCurrentUser();

    if (userResult.success) {
      const userData = userResult.data;
      const roles = userData.roles ?? [];
      user = {
        id: userData.id,
        name: userData.username ?? null,
        email: userData.email ?? null,
        roles,
        isAdmin: roles.some((r: any) => (typeof r === 'string' ? r === 'Admin' : r?.name === 'Admin')),
      };
    } else {
      fetchError = `ユーザー情報の取得に失敗しました (${userResult.error})`;
    }

    // タグ一覧を取得
    const tagsResult = await getTags(1, true);
    if (tagsResult.success) {
      tags = tagsResult.data?.data ?? [];
    } else {
      fetchError = `タグ一覧の取得に失敗しました (${tagsResult.error})`;
    }
  } catch (err: any) {
    console.error('AdminTags: failed to fetch data', err);
    fetchError = `データの取得に失敗しました (${err.message ?? String(err)})`;
  }

  return (
    <AdminTagsClient
      initialUser={user}
      initialTags={tags}
      fetchError={fetchError}
    />
  );
}