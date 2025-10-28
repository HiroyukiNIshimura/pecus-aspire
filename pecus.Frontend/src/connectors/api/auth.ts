import { getSession, signIn, signOut } from "next-auth/react";

// アクセストークン取得
export async function getAccessToken(): Promise<string> {
  const session = await getSession();
  if (!session?.accessToken) throw new Error("No access token");
  return session.accessToken as string;
}

// リフレッシュトークンで再取得
export async function refreshAccessToken(): Promise<string> {
  // next-authのリフレッシュAPIを呼ぶか、独自エンドポイントを叩く
  const result = await signIn("refresh-token", { redirect: false });
  if (!result?.ok) {
    await signOut();
    throw new Error("Failed to refresh token");
  }
  const session = await getSession();
  if (!session?.accessToken) throw new Error("No access token after refresh");
  return session.accessToken as string;
}
