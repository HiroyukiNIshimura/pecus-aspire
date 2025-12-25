import { notFound, redirect } from 'next/navigation';
import { getAllRoles } from '@/actions/admin/role';
import { getAllSkills } from '@/actions/admin/skills';
import { getUserDetail } from '@/actions/admin/user';
import { createPecusApiClients, detect401ValidationError, parseErrorResponse } from '@/connectors/api/PecusApiClient';
import type { RoleResponse, SkillListItemResponse } from '@/connectors/api/pecus';
import EditUserClient from './EditUserClient';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  if (Number.isNaN(userId) || userId <= 0) {
    notFound();
  }

  let userDetail = null;
  let skills: SkillListItemResponse[] = [];
  let roles: RoleResponse[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // 認証チェック（プロフィール取得）
    await api.profile.getApiProfile();

    const userDetailResult = await getUserDetail(userId);
    if (userDetailResult.success) {
      userDetail = userDetailResult.data;
    } else {
      fetchError = userDetailResult.error;
    }

    const skillsResult = await getAllSkills(true);
    if (skillsResult.success) {
      skills = skillsResult.data || [];
    }

    const rolesResult = await getAllRoles();
    if (rolesResult.success) {
      roles = rolesResult.data || [];
    }
  } catch (error) {
    const noAuthError = detect401ValidationError(error);
    // 認証エラーの場合はサインインページへリダイレクト
    if (noAuthError) {
      redirect('/signin');
    }

    fetchError = parseErrorResponse(error, 'データの取得中にエラーが発生しました。').message;
  }

  if (!userDetail) {
    notFound();
  }

  return (
    <EditUserClient userDetail={userDetail} availableSkills={skills} availableRoles={roles} fetchError={fetchError} />
  );
}
