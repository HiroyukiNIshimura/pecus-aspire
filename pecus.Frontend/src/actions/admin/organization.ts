"use server";

import { createPecusApiClients, detectConcurrencyError } from "@/connectors/api/PecusApiClient";
import { ApiResponse } from "../types";

/**
 * Server Action: 組織情報を取得
 */
export async function getOrganization(): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminOrganization.getApiAdminOrganization();
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch organization:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "Failed to fetch organization",
    };
  }
}

/**
 * Server Action: 組織情報を更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateOrganization(request: {
  name?: string;
  description?: string;
  rowVersion: string; // 楽観的ロック用
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response =
      await api.adminOrganization.putApiAdminOrganization(request);
    return { success: true, data: response };
  } catch (error: any) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: concurrencyError.payload,
      };
    }

    console.error("Failed to update organization:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "Failed to update organization",
    };
  }
}
