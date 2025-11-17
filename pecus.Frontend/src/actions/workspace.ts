"use server";

import {
  createPecusApiClients,
  detectConcurrencyError,
} from "@/connectors/api/PecusApiClient";
import type { WorkspaceFullDetailResponse } from "@/connectors/api/pecus";
import type { ApiResponse } from "./types";

/**
 * Server Action: ワークスペースを作成（一般ユーザー用）
 */
export async function createWorkspace(request: {
  name: string;
  code?: string;
  description?: string;
  genreId?: number;
}): Promise<ApiResponse<WorkspaceFullDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspace.postApiWorkspaces(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to create workspace:", error);

    // バリデーションエラー
    if (error.status === 400) {
      return {
        success: false,
        error: "validation",
        message:
          error.body?.message || error.message || "入力内容に誤りがあります。",
      };
    }

    // その他のエラー
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "ワークスペースの作成に失敗しました。",
    };
  }
}
