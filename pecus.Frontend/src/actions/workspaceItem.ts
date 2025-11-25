"use server";

import {
  createPecusApiClients,
  detectConcurrencyError,
} from "@/connectors/api/PecusApiClient";
import type {
  CreateWorkspaceItemRequest,
  UpdateWorkspaceItemAssigneeRequest,
  UpdateWorkspaceItemRequest,
  WorkspaceItemDetailResponse,
  WorkspaceItemResponse,
} from "@/connectors/api/pecus";
import type { ApiResponse } from "./types";

/**
 * Server Action: 最新のワークスペースアイテムを取得
 */
export async function fetchLatestWorkspaceItem(
  workspaceId: number,
  itemId: number,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItems1(
      workspaceId,
      itemId,
    );
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch workspace item:", error);
    console.error("Error status:", error.status);

    // アイテムが見つからない（404 Not Found）
    if (error.status === 404) {
      return {
        success: false,
        error: "not-found",
        message: "アイテムが見つかりません。",
      };
    }

    // その他のエラー
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "アイテムの取得に失敗しました。",
    };
  }
}

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

/**
 * Server Action: ワークスペースアイテムを更新
 */
export async function updateWorkspaceItem(
  workspaceId: number,
  itemId: number,
  request: UpdateWorkspaceItemRequest,
): Promise<ApiResponse<WorkspaceItemResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItems(
      workspaceId,
      itemId,
      request,
    );
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to update workspace item:", error);
    console.error("Error body:", error.body);
    console.error("Error status:", error.status);

    // 409 Conflict: 並行更新による競合
    const concurrency = detectConcurrencyError(error);
    if (concurrency) {
      return {
        success: false,
        error: "conflict",
        message: concurrency.message,
        latest: {
          type: "workspaceItem",
          data: concurrency.payload.current as WorkspaceItemDetailResponse,
        },
      };
    }

    // バリデーションエラー
    if (error.status === 400) {
      const errorMessages = Array.isArray(error.body)
        ? error.body.map((err: any) => err.message || err).join("、")
        : error.body?.message || error.message || "入力内容に誤りがあります。";

      return {
        success: false,
        error: "validation",
        message: errorMessages,
      };
    }

    // アイテムが見つからない（404 Not Found）
    if (error.status === 404) {
      return {
        success: false,
        error: "not-found",
        message: "アイテムが見つかりません。",
      };
    }

    // その他のエラー
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "アイテムの更新に失敗しました。",
    };
  }
}

/**
 * Server Action: ワークスペースアイテムの作業者を更新
 */
export async function updateWorkspaceItemAssignee(
  workspaceId: number,
  itemId: number,
  request: UpdateWorkspaceItemAssigneeRequest,
): Promise<ApiResponse<WorkspaceItemDetailResponse>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.patchApiWorkspacesItemsAssignee(
      workspaceId,
      itemId,
      request,
    );

    // レスポンスからアイテムデータを取得
    if (response.workspaceItem) {
      return {
        success: true,
        data: response.workspaceItem,
      };
    }

    return {
      success: false,
      error: "server",
      message: "アイテムの取得に失敗しました。",
    };
  } catch (error: any) {
    console.error("Failed to update workspace item assignee:", error);
    console.error("Error body:", error.body);
    console.error("Error status:", error.status);

    // 409 Conflict: 並行更新による競合
    const concurrency = detectConcurrencyError(error);
    if (concurrency) {
      return {
        success: false,
        error: "conflict",
        message: concurrency.message,
        latest:
          concurrency.payload.current &&
          typeof concurrency.payload.current === "object"
            ? {
                type: "workspaceItem",
                data: concurrency.payload
                  .current as WorkspaceItemDetailResponse,
              }
            : undefined,
      };
    }

    // バリデーションエラー
    if (error.status === 400) {
      const errorMessages = Array.isArray(error.body)
        ? error.body.map((err: any) => err.message || err).join("、")
        : error.body?.message || error.message || "入力内容に誤りがあります。";

      return {
        success: false,
        error: "validation",
        message: errorMessages,
      };
    }

    // アイテムが見つからない（404 Not Found）
    if (error.status === 404) {
      return {
        success: false,
        error: "not-found",
        message: "アイテムが見つかりません。",
      };
    }

    // その他のエラー
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "作業者の更新に失敗しました。",
    };
  }
}
