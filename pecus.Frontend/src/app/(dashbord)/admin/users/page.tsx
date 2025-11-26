import { redirect } from 'next/navigation';
import { getAllSkills } from '@/actions/admin/skills';
import { getUsers } from '@/actions/admin/user';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { SkillListItemResponse, UserResponse } from '@/connectors/api/pecus';
import { mapUserResponseToUserInfo } from '@/utils/userMapper';
import AdminUsersClient from './AdminUsersClient';

export const dynamic = 'force-dynamic';

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
  let userResponse: UserResponse | null = null;
  let skills: Skill[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    // ユーザー一覧を取得
    const usersResult = await getUsers(1, undefined, true); // 全ユーザー取得（アクティブ・非アクティブ両方）
    if (usersResult.success) {
      const responseData = usersResult.data;
      if (responseData?.data) {
        users = responseData.data.map((user: UserResponse) => ({
          id: user.id ?? 0,
          username: user.username ?? '',
          email: user.email ?? '',
          isActive: user.isActive ?? true,
          createdAt: user.createdAt ?? new Date().toISOString(),
          skills: user.skills ?? [],
        }));
        totalCount = responseData.totalCount ?? 0;
        totalPages = responseData.totalPages ?? 1;
        statistics = responseData.summary ?? null;
      }
    } else {
      fetchError = `ユーザー情報の取得に失敗しました: ${usersResult.error}`;
    }

    // スキル一覧を取得
    const skillsResult = await getAllSkills(true);
    if (skillsResult.success && skillsResult.data) {
      skills = skillsResult.data.map((skill: SkillListItemResponse) => ({
        id: skill.id,
        name: skill.name,
      }));
    }
  } catch (error) {
    console.error('AdminUsers: failed to fetch users, user info, or skills', error);

    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得に失敗しました').message;
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect('/signin');
  }

  // UserResponse から UserInfo に変換
  const userInfo = mapUserResponseToUserInfo(userResponse);

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
