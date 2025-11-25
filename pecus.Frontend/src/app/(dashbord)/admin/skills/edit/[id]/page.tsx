import { notFound, redirect } from "next/navigation";
import { getSkillDetail } from "@/actions/admin/skills";
import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { UserResponse } from "@/connectors/api/pecus";
import { mapUserResponseToUserInfo } from "@/utils/userMapper";
import EditSkillClient from "./EditSkillClient";

export const dynamic = "force-dynamic";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skillId = parseInt(id, 10);

  if (Number.isNaN(skillId) || skillId <= 0) {
    notFound();
  }

  let userResponse: UserResponse | null = null;
  let skillDetail = null;
  let fetchError = null;

  try {
    const api = createPecusApiClients();

    // ユーザー情報を取得
    userResponse = await api.profile.getApiProfile();

    const skillResult = await getSkillDetail(skillId);
    if (skillResult.success) {
      skillDetail = skillResult.data;
    } else {
      fetchError = skillResult.error;
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

  if (!skillDetail) {
    notFound();
  }

  return (
    <EditSkillClient
      initialUser={user}
      skillDetail={skillDetail}
      fetchError={fetchError}
    />
  );
}
