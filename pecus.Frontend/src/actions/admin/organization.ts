"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
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
      error:
        error.body?.message || error.message || "Failed to fetch organization",
    };
  }
}

/**
 * Server Action: 組織情報を更新
 */
export async function updateOrganization(request: {
  name?: string;
  description?: string;
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response =
      await api.adminOrganization.putApiAdminOrganization(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to update organization:", error);
    return {
      success: false,
      error:
        error.body?.message || error.message || "Failed to update organization",
    };
  }
}
