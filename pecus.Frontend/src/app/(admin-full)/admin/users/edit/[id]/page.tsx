import { notFound } from 'next/navigation';
import { getAllRoles } from '@/actions/admin/role';
import { getAllSkills } from '@/actions/admin/skills';
import { getUserDetail } from '@/actions/admin/user';
import FetchError from '@/components/common/feedback/FetchError';
import ForbiddenError from '@/components/common/feedback/ForbiddenError';
import { createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { RoleResponse, SkillListItemResponse } from '@/connectors/api/pecus';
import { handleServerFetch } from '@/libs/serverFetch';
import EditUserClient from './EditUserClient';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  if (Number.isNaN(userId) || userId <= 0) {
    notFound();
  }

  const api = createPecusApiClients();
  const authResult = await handleServerFetch(() => api.profile.getApiProfile());

  if (!authResult.success) {
    if (authResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/admin/users" backLabel="ユーザー一覧に戻る" />;
    }
    return <FetchError message={authResult.message} backUrl="/admin/users" backLabel="ユーザー一覧に戻る" />;
  }

  const userDetailResult = await getUserDetail(userId);
  if (!userDetailResult.success) {
    if (userDetailResult.error === 'forbidden') {
      return <ForbiddenError backUrl="/admin/users" backLabel="ユーザー一覧に戻る" />;
    }
    if (userDetailResult.error === 'not_found') {
      notFound();
    }
    return <FetchError message={userDetailResult.message} backUrl="/admin/users" backLabel="ユーザー一覧に戻る" />;
  }

  let skills: SkillListItemResponse[] = [];
  let roles: RoleResponse[] = [];

  const skillsResult = await getAllSkills(true);
  if (skillsResult.success) {
    skills = skillsResult.data || [];
  }

  const rolesResult = await getAllRoles();
  if (rolesResult.success) {
    roles = rolesResult.data || [];
  }

  return (
    <EditUserClient
      userDetail={userDetailResult.data}
      availableSkills={skills}
      availableRoles={roles}
      fetchError={null}
    />
  );
}
