"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { ApiResponse } from "./types";
import { SessionData, SessionManager } from "@/libs/session";

/**
 * Server Action: ログイン
 */
export async function login(request: {
  loginIdentifier: string;
  password: string;
}): Promise<ApiResponse<any>> {
  try {
    const api = createPecusApiClients(); // OpenAPI設定を使用（引数不要）
    const response = await api.entranceAuth.postApiEntranceAuthLogin({
      loginIdentifier: request.loginIdentifier,
      password: request.password,
    });

    // APIレスポンスからトークンを取得
    const accessToken = response.accessToken;
    const refreshToken = response.refreshToken || "";

    if (!accessToken) {
      return {
        success: false,
        error: "Invalid response from server",
      };
    }

    // セッション情報を保存
    const sessionData: SessionData = {
      accessToken,
      refreshToken,
      user: {
        id: response.userId || 0,
        name: response.username || "",
        email: response.email || "",
        roles: response.roles
          ? response.roles.map((role: any) => role.name || "")
          : [],
      },
    };

    await SessionManager.setSession(sessionData);

    return { success: true, data: response };
  } catch (error: any) {
    console.error("Failed to login:", error);
    return {
      success: false,
      error: error.body?.message || error.message || "Failed to login",
    };
  }
}

/**
 * Server Action: 現在のユーザー情報を取得
 *
 * 用途: SSR ページでの認証チェック
 * - ログイン済みならユーザー情報を返す
 * - 未認証なら null を返す
 */
export async function getCurrentUser(): Promise<ApiResponse<SessionData["user"] | null>> {
  try {
    const session = await SessionManager.getSession();

    if (!session || !session.user) {
      return { success: true, data: null };
    }

    return { success: true, data: session.user };
  } catch (error: any) {
    console.error("Failed to get current user:", error);
    return {
      success: false,
      error: error.message || "Failed to get current user",
    };
  }
}

/**
 * Server Action: ログアウト
 */
export async function logout(): Promise<ApiResponse<any>> {
  try {
    // セッション情報をクリア（WebAPI呼び出しなし）
    await SessionManager.clearSession();

    return { success: true, data: null };
  } catch (error: any) {
    console.error("Failed to logout:", error);
    return {
      success: false,
      error: error.message || "Failed to logout",
    };
  }
}
