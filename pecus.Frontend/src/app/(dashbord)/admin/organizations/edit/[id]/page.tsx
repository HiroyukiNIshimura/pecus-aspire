import { notFound } from "next/navigation";
import { getOrganizationDetail } from "@/actions/admin/organizations";
import { getCurrentUser } from "@/actions/profile";
import type { UserInfo } from "@/types/userInfo";
import EditOrganizationClient from "./EditOrganizationClient";

export const dynamic = "force-dynamic";

export default async function EditOrganizationPage() {
  let user: UserInfo | null = null;
  let organizationDetail = null;
  let fetchError = null;

  try {
    const userResult = await getCurrentUser();
    if (userResult.success && userResult.data) {
      user = userResult.data;
    }

    const organizationResult = await getOrganizationDetail();
    if (organizationResult.success) {
      organizationDetail = organizationResult.data;
    } else {
      fetchError = organizationResult.error;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      fetchError = err.message;
    } else {
      fetchError = "データの取得中にエラーが発生しました。";
    }
  }

  if (!organizationDetail) {
    notFound();
  }

  return (
    <EditOrganizationClient
      initialUser={user}
      organizationDetail={organizationDetail}
      fetchError={fetchError}
    />
  );
}
