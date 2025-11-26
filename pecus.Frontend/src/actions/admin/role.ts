"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { RoleResponse } from "@/connectors/api/pecus";
import type { ApiResponse } from "../types";

/**
 * Server Action: ロール一覧を取得
 */
export async function getAllRoles(): Promise<ApiResponse<RoleResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.master.getApiMasterRoles();
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch roles:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "ロール一覧の取得に失敗しました",
    };
  }
}
