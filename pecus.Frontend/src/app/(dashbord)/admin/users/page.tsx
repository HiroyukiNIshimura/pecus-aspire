import { getAllSkills } from "@/actions/admin/skills";
import { getUsers } from "@/actions/admin/user";
import { getCurrentUser } from "@/actions/profile";
import type { ApiErrorResponse } from "@/types/errors";
import type { UserInfo } from "@/types/userInfo";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

interface Skill {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  skills?: Skill[];
}

interface UserStatistics {
  skillCounts?: Array<{ id: number; name: string; count: number }>;
  roleCounts?: Array<{ id: number; name: string; count: number }>;
  activeUserCount?: number;
  inactiveUserCount?: number;
  workspaceParticipationCount?: number;
  noWorkspaceParticipationCount?: number;
}

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminUsers() {
  let users: User[] = [];
  let totalCount: number = 0;
  let totalPages: number = 1;
  let statistics: UserStatistics | null = null;
  let userInfo: UserInfo | null = null;
  let skills: Skill[] = [];
  let fetchError: string | null = null;

  try {
    // Server Actions を使用してデータ取得
    const [usersResult, userResult, skillsResult] = await Promise.all([
      getUsers(1, undefined, true), // 全ユーザー取得（アクティブ・非アクティブ両方）
      getCurrentUser(),
      getAllSkills(true), // 全スキルを取得（フィルター用）
    ]);

    // ユーザー一覧の処理
    if (usersResult.success) {
      const responseData = usersResult.data;
      if (responseData && responseData.data) {
        users = responseData.data.map((user: any) => ({
          id: user.id ?? 0,
          username: user.username ?? "",
          email: user.email ?? "",
          isActive: user.isActive ?? true,
          createdAt: user.createdAt ?? new Date().toISOString(),
          skills: user.skills ?? [],
        }));
        totalCount = responseData.totalCount ?? 0;
        totalPages = responseData.totalPages ?? 1;
        statistics = responseData.summary ?? null;
      }
    } else {
      // エラーコード方式で返す
      const error: ApiErrorResponse = {
        code: "FETCH_ERROR",
        message: `ユーザー情報の取得に失敗しました: ${usersResult.error}`,
        statusCode: 500,
      };
      fetchError = JSON.stringify(error);
    }

    // 現在のユーザー情報の処理
    if (userResult.success) {
      const userData = userResult.data;
      userInfo = {
        id: userData.id,
        name: userData.name ?? null,
        email: userData.email ?? null,
        isAdmin: userData.isAdmin ?? false,
      } as UserInfo;
    }

    // スキル一覧の処理
    if (skillsResult.success && skillsResult.data) {
      // getAllSkills は配列を直接返す
      skills = skillsResult.data.map((skill: any) => ({
        id: skill.id,
        name: skill.name,
      }));
    }
  } catch (err: any) {
    console.error(
      "AdminUsers: failed to fetch users, user info, or skills",
      err,
    );
    // エラーコード方式で返す
    const error: ApiErrorResponse = {
      code: "UNKNOWN_ERROR",
      message: `データの取得に失敗しました: ${err.message ?? String(err)}`,
      statusCode: 500,
    };
    fetchError = JSON.stringify(error);
  }

  return (
    <AdminUsersClient
      initialUsers={users}
      initialTotalCount={totalCount}
      initialTotalPages={totalPages}
      initialUser={userInfo}
      initialStatistics={statistics}
      initialSkills={skills}
      fetchError={fetchError}
    />
  );
}
