import { notFound, redirect } from "next/navigation";
import { getAllRoles } from "@/actions/admin/role";
import { getAllSkills } from "@/actions/admin/skills";
import { getUserDetail } from "@/actions/admin/user";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse } from "@/connectors/api/pecus";
import { mapUserResponseToUserInfo } from "@/utils/userMapper";
import EditUserClient from "./EditUserClient";

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

  let userResponse: UserResponse | null = null;
  let userDetail = null;
  let skills: any[] = [];
  let roles: any[] = [];
  let fetchError: string | null = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

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
  } catch (error: any) {
    // 認証エラーの場合はサインインページへリダイレクト
    if (error.status === 401) {
      redirect("/signin");
    }

    fetchError =
      error.body?.message ||
      error.message ||
      "データの取得中にエラーが発生しました。";
  }

  // エラーまたはユーザー情報が取得できない場合はリダイレクト
  if (!userResponse) {
    redirect("/signin");
  }

  // UserResponse から UserInfo に変換
  const user = mapUserResponseToUserInfo(userResponse);

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
