import { getAccessToken } from "./auth";
import {
  configureOpenAPI,
  createApiClientInstances,
} from "./PecusApiClient.generated";
import Axios from "axios";
import { ErrorResponse } from "./pecus";
import type { ConcurrencyErrorResponseBody } from "./ConflictDataTypes";

/**
 * 並行更新による競合エラー（汎用型）
 * サーバーからの 409 Conflict レスポンスをラップ
 *
 * @template T - payload の型（デフォルト: ConcurrencyErrorResponseBody）
 *
 * @example
 * try {
 *   await clients.adminWorkspace.updateWorkspace(id, data);
 * } catch (error) {
 *   const concurrencyError = detectConcurrencyError(error);
 *   if (concurrencyError) {
 *     // 409 Conflict: 最新データで再試行が必要
 *     console.log(concurrencyError.message); // ユーザーメッセージ
 *     console.log(concurrencyError.payload); // ConcurrencyErrorResponseBody 型
 *     console.log(concurrencyError.payload.current); // 最新のエンティティ
 *   }
 * }
 */
export class ConcurrencyError<T = ConcurrencyErrorResponseBody> extends Error {
  public readonly payload: T;

  constructor(message: string, payload?: T) {
    super(message);
    this.name = "ConcurrencyError";
    this.payload = payload as T;
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}

/**
 * openapi-typescript-codegen の ApiError から 409 Conflict を検出
 *
 * @param error - キャッチしたエラーオブジェクト
 * @returns 409 の場合は ConcurrencyError<ConcurrencyErrorResponseBody>、それ以外は null
 *
 * @example
 * try {
 *   await clients.adminWorkspace.putApiAdminWorkspaces(id, input);
 * } catch (error) {
 *   const concurrencyError = detectConcurrencyError(error);
 *   if (concurrencyError) {
 *     // payload は ConcurrencyErrorResponseBody 型
 *     const { message, current } = concurrencyError.payload;
 *     return {
 *       success: false,
 *       error: "conflict",
 *       message,
 *       latest: buildConflictLatestData(current, 'workspace'),
 *     };
 *   }
 *   throw error; // その他のエラーは再スロー
 * }
 */
export function detectConcurrencyError(error: unknown): ConcurrencyError<ConcurrencyErrorResponseBody> | null {
  // Axios エラーの場合、status が 409 かをチェック
  if (Axios.isAxiosError(error) && error.response?.status === 409) {
    const body = error.response.data ?? {};

    // レスポンスボディから message を抽出
    const message =
      (typeof body === "object" &&
      body !== null &&
      "message" in body
        ? (body as Record<string, unknown>).message
        : null) || "別のユーザーにより変更されました。";

    return new ConcurrencyError<ConcurrencyErrorResponseBody>(String(message), body as ConcurrencyErrorResponseBody);
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
