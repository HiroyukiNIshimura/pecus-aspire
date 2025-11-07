import AdminClient from "./AdminClient";
import { getOrganization } from "@/actions/admin/organization";
import { getCurrentUser } from "@/actions/profile";
import type { ApiErrorResponse } from "@/types/errors";
import { UserInfo } from "@/types/userInfo";

export const dynamic = "force-dynamic";

type OrganizationData = {
  id?: number | string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  representativeName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isActive?: boolean;
  userCount?: number | null;
};

// Server-side page (SSR). Fetch required data here and pass to client component.
export default async function AdminPage() {
  let organization: OrganizationData | null = null;
  let user: UserInfo | null = null;
  let fetchError: string | null = null;

  try {
    // Server Actions を使用してデータ取得
    // Middlewareが事前に認証チェックを行うため、ここでは401エラーは発生しない
    const [orgResult, userResult] = await Promise.all([
      getOrganization(),
      getCurrentUser(),
    ]);

    // 組織情報の処理
    if (orgResult.success) {
      organization = orgResult.data as OrganizationData;
    } else {
      // エラーコード方式で返す
      const error: ApiErrorResponse = {
        code: "FETCH_ERROR",
        message: `組織情報の取得に失敗しました: ${orgResult.error}`,
        statusCode: 500,
      };
      fetchError = JSON.stringify(error);
    }

    // ユーザー情報の処理
    if (userResult.success) {
      const userData = userResult.data;
      user = {
        id: userData.id,
        name: userData.name ?? null,
        email: userData.email ?? null,
        isAdmin: userData.isAdmin ?? false,
      } as UserInfo;
    }
  } catch (err: any) {
    console.error("AdminPage: failed to fetch organization or user", err);
    // エラーコード方式で返す
    const error: ApiErrorResponse = {
      code: "UNKNOWN_ERROR",
      message: `データの取得に失敗しました: ${err.message ?? String(err)}`,
      statusCode: 500,
    };
    fetchError = JSON.stringify(error);
  }

  return (
    <AdminClient
      initialOrganization={organization}
      initialUser={user}
      fetchError={fetchError}
    />
  );
}
