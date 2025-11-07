"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { ApiResponse } from "../types";

/**
 * Server Action: ロール一覧を取得
 */
export async function getAllRoles(): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.masterData.getApiMasterRoles();
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch roles:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "ロール一覧の取得に失敗しました",
    };
  }
}

