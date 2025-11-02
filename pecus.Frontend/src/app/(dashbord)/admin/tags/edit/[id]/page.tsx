import { notFound } from "next/navigation";
import { getCurrentUser } from "@/actions/profile";
import { getTagDetail } from "@/actions/admin/tags";
import EditTagClient from "./EditTagClient";

export const dynamic = "force-dynamic";

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
};

export default async function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tagId = parseInt(id, 10);

  if (isNaN(tagId) || tagId <= 0) {
    notFound();
  }

  let user: UserInfo | null = null;
  let tagDetail = null;
  let fetchError = null;

  try {
    const userResult = await getCurrentUser();
    if (userResult.success && userResult.data) {
      user = userResult.data;
    }

    const tagResult = await getTagDetail(tagId);
    if (tagResult.success) {
      tagDetail = tagResult.data;
    } else {
      fetchError = tagResult.error;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      fetchError = err.message;
    } else {
      fetchError = "データの取得中にエラーが発生しました。";
    }
  }

  if (!tagDetail) {
    notFound();
  }

  return (
    <EditTagClient
      initialUser={user}
      tagDetail={tagDetail}
      fetchError={fetchError}
    />
  );
}
