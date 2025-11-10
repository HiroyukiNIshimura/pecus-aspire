import { getWorkspaces } from "@/actions/admin/workspace";
import { getGenres } from "@/actions/master";
import { getCurrentUser } from "@/actions/profile";
import type {
  MasterGenreResponse,
  WorkspaceListItemResponse,
  WorkspaceStatistics,
} from "@/connectors/api/pecus";
import type { UserInfo } from "@/types/userInfo";
import AdminWorkspacesClient from "./AdminWorkspacesClient";

export const dynamic = "force-dynamic";

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminWorkspaces() {
  let workspaces: WorkspaceListItemResponse[] = [];
  let totalCount: number = 0;
  let totalPages: number = 1;
  let statistics: WorkspaceStatistics | null = null;
  let user: UserInfo | null = null;
  let genres: MasterGenreResponse[] = [];
  let fetchError: string | null = null;

  try {
    // Server Actions を使用してデータ取得
    // Middlewareが事前に認証チェックを行うため、ここでは401エラーは発生しない
    const [workspacesResult, userResult, genresResult] = await Promise.all([
      getWorkspaces(1, true),
      getCurrentUser(),
      getGenres(),
    ]);

    // ワークスペース情報の処理
    if (workspacesResult.success) {
      const responseData = workspacesResult.data;
      workspaces = responseData?.data ?? [];
      totalCount = responseData?.totalCount ?? 0;
      totalPages = responseData?.totalPages ?? 1;
      statistics = responseData?.summary ?? null;
    } else {
      fetchError = `ワークスペース情報の取得に失敗しました (${workspacesResult.error})`;
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

    // ジャンル情報の処理
    if (genresResult.success) {
      genres = genresResult.data ?? [];
    }
  } catch (err: any) {
    console.error("AdminWorkspaces: failed to fetch data", err);
    fetchError = `データの取得に失敗しました (${err.message ?? String(err)})`;
  }

  return (
    <AdminWorkspacesClient
      initialWorkspaces={workspaces}
      initialTotalCount={totalCount}
      initialTotalPages={totalPages}
      initialUser={user}
      initialStatistics={statistics}
      initialGenres={genres}
      fetchError={fetchError}
    />
  );
}
