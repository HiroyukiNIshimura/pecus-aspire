import { getAccessToken } from "./auth";
import {
  configureOpenAPI,
  createApiClientInstances,
} from "./PecusApiClient.generated";

/**
 * Pecus API クライアントを初期化して返す
 *
 * 新しいアーキテクチャ（openapi-typescript-codegen）:
 * - グローバルな OpenAPI 設定を使用
 * - Service クラスは静的メソッドでAPIを呼び出す
 * - トークンは OpenAPI.TOKEN に設定された関数から取得される
 *
 * Server Actions から呼ばれる場合:
 * - リクエストごとに新しい設定が適用される
 * - getAccessToken() が自動的にトークンを取得
 */
export function createPecusApiClients() {
  // OpenAPI 設定を初期化
  configureOpenAPI(
    process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://localhost:7265",
    async () => {
      const token = await getAccessToken();
      return token ?? undefined;
    },
  );

  // API サービスインスタンスを返す
  return createApiClientInstances();
}
