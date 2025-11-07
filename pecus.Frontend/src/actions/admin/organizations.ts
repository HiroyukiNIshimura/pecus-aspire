"use server";

import { createPecusApiClients, detectConcurrencyError } from "@/connectors/api/PecusApiClient";
import { ApiResponse } from "../types";

/**
 * Server Action: 自組織の詳細情報を取得
 */
export async function getOrganizationDetail(): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminOrganization.getApiAdminOrganization();
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch organization detail:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "組織情報の取得に失敗しました",
    };
  }
}

/**
 * Server Action: 自組織の情報を更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function updateOrganization(
  request: {
    name?: string;
    code?: string;
    description?: string;
    representativeName?: string;
    phoneNumber?: string;
    email?: string;
    isActive?: boolean;
    rowVersion: string; // 楽観的ロック用
  },
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminOrganization.putApiAdminOrganization(request);
    return { success: true, data: response };
  } catch (error: any) {
    // 409 Conflict: 並行更新による競合を検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "organization",
          data: concurrencyError.payload,
        } as const,
      };
    }

    console.error("Failed to update organization:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "組織情報の更新に失敗しました",
    };
  }
}