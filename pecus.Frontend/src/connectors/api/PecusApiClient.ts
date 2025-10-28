
import * as PecusApis from "./pecus";
import { getAccessToken, refreshAccessToken } from "./auth";

// すべてのAPIクラス名を列挙
const apiClassNames = Object.keys(PecusApis).filter(
  (k) => typeof (PecusApis as any)[k] === "function" && k.endsWith("Api")
);

export async function callWithAutoRefresh<T>(
  apiCall: (token: string) => Promise<T>
): Promise<T> {
  let token = await getAccessToken();
  try {
    return await apiCall(token);
  } catch (err: any) {
    // 401など認証エラー時はリフレッシュ
    if (err?.response?.status === 401) {
      token = await refreshAccessToken();
      return await apiCall(token);
    }
    throw err;
  }
}

export function createPecusApiClients(token: string) {
  const config = new PecusApis.Configuration({
    basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
    accessToken: () => token,
  });
  const clients: Record<string, any> = {};
  for (const name of apiClassNames) {
    clients[name] = new (PecusApis as any)[name](config);
  }
  return clients;
}
