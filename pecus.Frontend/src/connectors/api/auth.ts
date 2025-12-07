"use server";

import { SessionManager } from "@/libs/session";

/**
 * アクセストークン取得（SSR専用）
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await SessionManager.getSession();
    return session?.accessToken ?? null;
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
}

/**
 * リフレッシュトークン取得（SSR専用）
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const session = await SessionManager.getSession();
    return session?.refreshToken ?? null;
  } catch (error) {
    console.error("Failed to get refresh token:", error);
    return null;
  }
}

/**
 * トークンリフレッシュ処理（Server Action）
 *
 * Server Action として定義することで、SessionManager.setSession() が正常に動作します。
 *
 * fetchを使う理由:
 * - axiosインターセプターの循環呼び出しを防ぐため
 * - リフレッシュ処理はシンプルなPOSTで十分なため
 *
 * @returns 新しいアクセストークンと永続化フラグ
 */
export async function refreshAccessToken(): Promise<{
  accessToken: string;
  persisted: boolean;
}> {
  console.log("Refreshing access token");

  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // WebAPIのリフレッシュエンドポイントを直接呼び出す
    const apiBaseUrl = process.env.API_BASE_URL || "https://localhost:7265";
    const response = await fetch(`${apiBaseUrl}/api/entrance/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Refresh API error:", errorText);

      // 400エラー時はセッションをクリア（リフレッシュトークンが無効）
      if (response.status === 400) {
        try {
          await SessionManager.clearSession();
        } catch (clearError) {
          console.error("Failed to clear session:", clearError);
        }
      }

      const error: any = new Error(
        `Failed to refresh access token: ${response.status}`,
      );
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    console.log("Refresh API success, updating session");

    // 現在のユーザー情報を取得
    const currentSession = await SessionManager.getSession();
    if (!currentSession) {
      throw new Error("No current session");
    }

    // セッションを更新（Server Action コンテキストでのみ可能）
    try {
      await SessionManager.setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: currentSession.user, // 既存のユーザー情報を保持
      });
      console.log("Session updated successfully");
      return { accessToken: data.accessToken, persisted: true };
    } catch (sessionError: any) {
      // Server Action コンテキスト外から呼ばれた場合（Axiosインターセプター経由など）
      // Cookie更新はスキップし、メモリ上のトークンのみを返す
      if (sessionError.message?.includes("Cookies can only be modified")) {
        console.warn(
          "Cannot update session cookies outside Server Action context, returning token only",
        );
        return { accessToken: data.accessToken, persisted: false };
      }
      throw sessionError;
    }
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw error;
  }
}

/**
 * ログアウト処理
 */
export async function logout(): Promise<void> {
  try {
    const session = await SessionManager.getSession();
    const accessToken = session?.accessToken;
    const refreshToken = session?.refreshToken;

    // WebAPIのログアウトエンドポイントを呼ぶ（fetchを使用）
    if (accessToken) {
      const apiBaseUrl = process.env.API_BASE_URL || "https://localhost:7265";
      try {
        await fetch(`${apiBaseUrl}/api/entrance/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken: refreshToken || "" }),
        });
      } catch (error) {
        console.error("Failed to call logout API:", error);
        // エラーは無視してセッションクリアを続行
      }
    }

    await SessionManager.clearSession();
  } catch (error) {
    console.error("Failed to logout:", error);
    throw error;
  }
}
