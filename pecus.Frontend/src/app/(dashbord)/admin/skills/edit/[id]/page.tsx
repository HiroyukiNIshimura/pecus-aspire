import { notFound } from "next/navigation";
import { getCurrentUser } from "@/actions/profile";
import { getSkillDetail } from "@/actions/admin/skills";
import EditSkillClient from "./EditSkillClient";

export const dynamic = "force-dynamic";

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
};

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skillId = parseInt(id, 10);

  if (isNaN(skillId) || skillId <= 0) {
    notFound();
  }

  let user: UserInfo | null = null;
  let skillDetail = null;
  let fetchError = null;

  try {
    const userResult = await getCurrentUser();
    if (userResult.success && userResult.data) {
      user = userResult.data;
    }

    const skillResult = await getSkillDetail(skillId);
    if (skillResult.success) {
      skillDetail = skillResult.data;
    } else {
      fetchError = skillResult.error;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      fetchError = err.message;
    } else {
      fetchError = "データの取得中にエラーが発生しました。";
    }
  }

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
