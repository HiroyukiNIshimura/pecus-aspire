"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
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
      error:
        error.body?.message ||
        error.message ||
        "組織情報の取得に失敗しました",
    };
  }
}

/**
 * Server Action: 自組織の情報を更新
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
  },
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminOrganization.putApiAdminOrganization(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to update organization:", error);
    return {
      success: false,
      error:
        error.body?.message ||
        error.message ||
        "組織情報の更新に失敗しました",
    };
  }
}