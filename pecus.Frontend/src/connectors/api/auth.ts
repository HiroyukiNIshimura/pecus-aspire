import { getSession, signIn, signOut } from "next-auth/react";
import axios from "axios";

// アクセストークン取得
export async function getAccessToken(): Promise<string> {
  const session = await getSession();
  if (!session?.accessToken) throw new Error("No access token");
  return session.accessToken as string;
}

// リフレッシュトークン取得
export async function getRefreshToken(): Promise<string> {
  const session = await getSession();
  if (!session?.refreshToken) throw new Error("No refresh token");
  return session.refreshToken as string;
}

// リフレッシュトークンで再取得
export async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getRefreshToken();

  try {
    // next-auth の refresh-token プロバイダーを使用
    const result = await signIn("refresh-token", {
      refreshToken,
      redirect: false
    });

    if (!result?.ok) {
      await signOut();
      throw new Error("Failed to refresh token");
    }

    const session = await getSession();
    if (!session?.accessToken) throw new Error("No access token after refresh");
    return session.accessToken as string;
  } catch (error) {
    await signOut();
    throw new Error("Failed to refresh token");
  }
}
