"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import type { WorkspaceItemResponse } from "@/connectors/api/pecus";
import type { CreateWorkspaceItemRequest } from "@/connectors/api/pecus";
import type { ApiResponse } from "./types";

/**
 * Server Action: ワークスペースアイテムを作成
 */
export async function createWorkspaceItem(
  workspaceId: number,
  request: CreateWorkspaceItemRequest,
): Promise<ApiResponse<WorkspaceItemResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.postApiWorkspacesItems(
      workspaceId,
      request,
    );
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to create workspace item:", error);
    console.error("Error body:", error.body);
    console.error("Error status:", error.status);

    // バリデーションエラー
    if (error.status === 400) {
      // エラーボディが配列の場合（複数のバリデーションエラー）
      const errorMessages = Array.isArray(error.body)
        ? error.body.map((err: any) => err.message || err).join("、")
        : error.body?.message || error.message || "入力内容に誤りがあります。";

      return {
        success: false,
        error: "validation",
        message: errorMessages,
      };
    }

    // ワークスペースが見つからない（404 Not Found）
    if (error.status === 404) {
      return {
        success: false,
        error: "not-found",
        message: "ワークスペースが見つかりません。",
      };
    }

    // その他のエラー
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "アイテムの作成に失敗しました。",
    };
  }
}
