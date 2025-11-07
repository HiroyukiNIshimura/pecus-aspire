"use server";

import { createPecusApiClients, detectConcurrencyError } from "@/connectors/api/PecusApiClient";
import { ApiResponse } from "../types";

/**
 * Server Action: ユーザー一覧を取得
 */
export async function getUsers(
  page: number = 1,
  pageSize?: number,
  isActive?: boolean,
  username?: string,
  skillIds?: number[],
  skillFilterMode: string = "and",
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.getApiAdminUsers1(
      page,
      pageSize,
      isActive,
      username,
      skillIds,
      skillFilterMode,
    );
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to fetch users",
    };
  }
}

/**
 * Server Action: パスワードなしでユーザーを作成（招待）
 */
export async function createUserWithoutPassword(request: {
  email: string;
  username: string;
  roles: number[];
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response =
      await api.adminUser.postApiAdminUsersCreateWithoutPassword(request);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to create user",
    };
  }
}

/**
 * Server Action: ユーザーを削除
 */
export async function deleteUser(userId: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.deleteApiAdminUsers(userId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return {
      success: false,
      error: "server",
      message: error.body?.message || error.message || "Failed to delete user",
    };
  }
}

/**
 * Server Action: ユーザーのアクティブ状態を設定
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function setUserActiveStatus(
  userId: number,
  isActive: boolean,
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.putApiAdminUsersActiveStatus(userId, {
      isActive,
    });
    return { success: true, data: response };
  } catch (error: any) {
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: {
          type: "user",
          data: concurrencyError.payload as any,
        },
      };
    }
    console.error("Failed to set user active status:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "Failed to set user active status",
    };
  }
}

/**
 * Server Action: パスワードリセットをリクエスト
 */
export async function requestPasswordReset(
  userId: number,
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response =
      await api.adminUser.postApiAdminUsersRequestPasswordReset(userId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to request password reset:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "Failed to request password reset",
    };
  }
}

/**
 * Server Action: ユーザー情報を取得
 */
export async function getUserDetail(userId: number): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.getApiAdminUsers(userId);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to fetch user detail:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "ユーザー情報の取得に失敗しました",
    };
  }
}

/**
 * Server Action: ユーザー情報を更新（基本情報）
 * 注意: バックエンドで PUT /api/admin/users/{id} エンドポイントが実装されている必要があります
 */
export async function updateUser(
  userId: number,
  request: {
    username: string;
    email: string;
  },
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    // 現在のバックエンドにはユーザー基本情報の更新エンドポイントがないため、
    // 以下は将来の実装を想定しています
    // const response = await api.adminUser.putApiAdminUsers(userId, request);
    // 代わりにアクティブ状態の更新のみ対応
    console.warn(
      "updateUser: ユーザー基本情報の更新エンドポイントは未実装です",
    );
    return {
      success: false,
      error: "server",
      message: "ユーザー基本情報の更新機能は現在利用できません",
    };
  } catch (error: any) {
    console.error("Failed to update user:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message || error.message || "ユーザーの更新に失敗しました",
    };
  }
}

/**
 * Server Action: ユーザーのスキルを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 */
export async function setUserSkills(
  userId: number,
  skillIds: number[],
  userRowVersion: string,
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.putApiAdminUsersSkills(userId, {
      skillIds,
      userRowVersion,
    });
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
          type: "user",
          data: concurrencyError.payload as any,
        },
      };
    }

    console.error("Failed to set user skills:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "ユーザースキルの更新に失敗しました",
    };
  }
}

/**
 * Server Action: ユーザーのロールを更新
 * @note 409 Conflict: 並行更新による競合。最新データを返す
 *
 * Note: userRowVersion は楽観的ロック用で、バックエンド側で検証されます。
 * 現在のバックエンドで UserResponse に rowVersion が含まれていないため、
 * オプション扱いですが、将来的には必須化予定です。
 */
export async function setUserRoles(
  userId: number,
  roleIds: number[],
  userRowVersion: string,
): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients();
    const response = await api.adminUser.putApiAdminUsersRoles(userId, {
      roles: roleIds,
      userRowVersion,
    });
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
          type: "user",
          data: concurrencyError.payload as any,
        },
      };
    }

    console.error("Failed to set user roles:", error);
    return {
      success: false,
      error: "server",
      message:
        error.body?.message ||
        error.message ||
        "ユーザーロールの更新に失敗しました",
    };
  }
}
