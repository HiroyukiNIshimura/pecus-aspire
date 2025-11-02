"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { ApiResponse } from "../types";

/**
 * Server Action: ロール一覧を取得（ダミーデータを返す）
 * 注: BackendRoleControllerの /api/backend/roles は[Authorize(Roles = "Backend")]で保護されているため
 * 通常のユーザーはアクセスできません。
 * 実装に応じてMasterDataControllerにロール取得エンドポイントを追加してください。
 */
export async function getAllRoles(): Promise<ApiResponse<any>> {
  try {
    // TODO: 本来はバックエンドのマスターデータAPIからロール一覧を取得
    // ここでは一般的なロール（Admin, User, Moderator等）を返します
    const dummyRoles = [
      { id: 1, name: "Admin", description: "管理者" },
      { id: 2, name: "User", description: "ユーザー" },
      { id: 3, name: "Moderator", description: "モデレーター" },
    ];

    return { success: true, data: dummyRoles };
  } catch (error: any) {
    console.error("Failed to fetch roles:", error);
    return {
      success: false,
      error:
        error.body?.message ||
        error.message ||
        "ロール一覧の取得に失敗しました",
    };
  }
}
