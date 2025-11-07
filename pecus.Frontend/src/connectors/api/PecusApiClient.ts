import { getAccessToken } from "./auth";
import {
  configureOpenAPI,
  createApiClientInstances,
} from "./PecusApiClient.generated";

/**
 * 並行更新による競合エラー
 * サーバーからの 409 Conflict レスポンスをラップ
 *
 * @example
 * try {
 *   await clients.workspace.updateWorkspace(id, data);
 * } catch (error) {
 *   const concurrencyError = detectConcurrencyError(error);
 *   if (concurrencyError) {
 *     // 409 Conflict: 最新データで再試行が必要
 *     console.log(concurrencyError.message); // ユーザーメッセージ
 *     console.log(concurrencyError.payload); // サーバーからのレスポンスボディ
 *   }
 * }
 */
export class ConcurrencyError extends Error {
  public readonly payload: unknown;

  constructor(message: string, payload?: unknown) {
    super(message);
    this.name = "ConcurrencyError";
    this.payload = payload;
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}

/**
 * openapi-typescript-codegen の ApiError から 409 Conflict を検出
 *
 * @param error - キャッチしたエラーオブジェクト
 * @returns 409 の場合は ConcurrencyError、それ以外は null
 *
 * @example
 * try {
 *   await clients.adminWorkspace.putApiAdminWorkspaces(id, input);
 * } catch (error) {
 *   const concurrencyError = detectConcurrencyError(error);
 *   if (concurrencyError) {
 *     return {
 *       success: false,
 *       error: "conflict",
 *       message: concurrencyError.message,
 *       latest: concurrencyError.payload,
 *     };
 *   }
 *   throw error; // その他のエラーは再スロー
 * }
 */
export function detectConcurrencyError(error: unknown): ConcurrencyError | null {
  // ApiError の場合、status が 409 かをチェック
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as Record<string, unknown>).status === 409
  ) {
    const apiError = error as Record<string, unknown>;
    const body = apiError.body ?? {};

    // レスポンスボディから message を抽出
    const message =
      (typeof body === "object" &&
      body !== null &&
      "message" in body
        ? (body as Record<string, unknown>).message
        : null) || "別のユーザーにより変更されました。";

    return new ConcurrencyError(String(message), body);
  }

  return null;
}

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
