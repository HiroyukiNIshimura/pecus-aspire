"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { MasterGenreResponse } from "@/connectors/api/pecus";
import { ApiResponse } from "./types";

/**
 * Server Action: マスタージャンル一覧を取得
 */
export async function getGenres(): Promise<ApiResponse<MasterGenreResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.masterData.getApiMasterGenres();
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch genres:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to fetch genres",
    };
  }
}
