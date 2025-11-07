import { notFound } from "next/navigation";
import { getCurrentUser } from "@/actions/profile";
import { getUserDetail } from "@/actions/admin/user";
import { getAllSkills } from "@/actions/admin/skills";
import { getAllRoles } from "@/actions/admin/role";
import EditUserClient from "./EditUserClient";
import { UserInfo } from "@/types/userInfo";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  if (isNaN(userId) || userId <= 0) {
    notFound();
  }

  let user: UserInfo | null = null;
  let userDetail = null;
  let skills: any[] = [];
  let roles: any[] = [];
  let fetchError: string | null = null;

  try {
    const userResult = await getCurrentUser();
    if (userResult.success && userResult.data) {
      user = userResult.data;
    }

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
  } catch (err: unknown) {
    if (err instanceof Error) {
      fetchError = err.message;
    } else {
      fetchError = "データの取得中にエラーが発生しました。";
    }
  }

  if (!userDetail) {
    notFound();
  }

  return (
    <EditUserClient
      initialUser={user}
      userDetail={userDetail}
      availableSkills={skills}
      availableRoles={roles}
      fetchError={fetchError}
    />
  );
}
