import { getAccessToken } from "./auth";
import {
  configureOpenAPI,
  createApiClientInstances,
} from "./PecusApiClient.generated";
import Axios from "axios";
import type { ConcurrencyErrorResponseBody } from "./ConflictDataTypes.generated";
import { ErrorResponse } from "@/actions/types";
import { ApiError } from "./pecus/core/ApiError";

const isApiError = (error: unknown): error is ApiError=> {
  return error instanceof ApiError;
};

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
  let body;
  if (isApiError(error) && error.status === 409) {
    body = error.body ?? {};
  } else if (Axios.isAxiosError(error) && error.response?.status === 409) {
    body = error.response.data ?? {};
  } else {
    return null;
  }

  // レスポンスボディから message を抽出
  const message =
    (typeof body === "object" &&
    body !== null &&
    "message" in body
      ? (body as Record<string, unknown>).message
      : null) || "別のユーザーにより変更されました。";

  console.error('Concurrency error detected:', message);
  return new ConcurrencyError<ConcurrencyErrorResponseBody>(String(message), body as ConcurrencyErrorResponseBody);
}


export function detect401ValidationError(error: unknown): ErrorResponse | undefined {
  if ((isApiError(error) && error.status === 401) ||
      (Axios.isAxiosError(error) && error.response?.status === 401)) {
    return {
      success: false,
      error: 'unauthorized',
      message: '認証に失敗しました。ログイン状態を確認してください。',
    };
  }
  return undefined;
}

export function detect400ValidationError(error: unknown): ErrorResponse | undefined {
  let body;
  if (isApiError(error) && error.status === 400) {
    body = error.body ?? {};
  } else if (Axios.isAxiosError(error) && error.response?.status === 400) {
    body = error.response.data ?? {};
  } else {
    return undefined;
  }

  // デバッグ用: body全体を出力
  console.error('400 Bad Request body:', JSON.stringify(body, null, 2));

  const message =
    (typeof body === "object" &&
    body !== null &&
    "message" in body
      ? (body as Record<string, unknown>).message
      : null) || '入力内容に誤りがあります。';

  console.error('Validation error detected:', message);
  return {
    success: false,
    error: 'validation',
    message: String(message),
  };
}

export function detect404ValidationError(error: unknown): ErrorResponse | undefined {
  if ((Axios.isAxiosError(error) && error.response?.status === 404)||
    Axios.isAxiosError(error) && error.response?.status === 404) {
    console.error('Not Found error detected:', error.message);
    return {
      success: false,
      error: 'not_found',
      message: '対象が見つかりません。',
    };
  }
  return undefined;
}

export function detect403ValidationError(error: unknown): ErrorResponse | undefined {
  if ((isApiError(error) && error.status === 403) ||
    (Axios.isAxiosError(error) && error.response?.status === 403)) {
    console.error('Forbidden error detected:', error.message);
    return {
      success: false,
      error: 'forbidden',
      message: 'アクセスが禁止されています。',
    };
  }
  return undefined;
}

export const parseErrorResponse = (error: unknown, defaultMessage?: string): ErrorResponse => {
  if (typeof error === 'string') {
    return {
      success: false,
      error: 'server',
      message: error || defaultMessage || 'An unexpected error occurred',
    };
  }

  if (Axios.isAxiosError(error)) {
    return {
      success: false,
      error: 'server',
      message: error.message || defaultMessage || 'An unexpected error occurred',
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: 'server',
      message: error.message || defaultMessage || 'An unexpected error occurred',
    };
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      return {
        success: false,
        error: 'server',
        message: (error.message as string) || defaultMessage || 'An unexpected error occurred',
      };
    }
    if ('body' in error && typeof error.body === 'object' && error.body !== null && 'message' in error.body) {
      return {
        success: false,
        error: 'server',
        message: (error.body?.message as string) || defaultMessage || 'An unexpected error occurred',
      };
    }
  }
  return {
    success: false,
    error: 'server',
    message: defaultMessage || 'An unexpected error occurred',
  };
};


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
  // BASE URL を環境に応じて決定
  const baseUrl =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://localhost:7265";

  // OpenAPI 設定を初期化
  configureOpenAPI(baseUrl, async () => {
    const token = await getAccessToken();
    return token ?? undefined;
  });

  // API サービスインスタンスを返す
  return createApiClientInstances();
}

/**
 * 認証済み Axios インスタンスを作成
 * バイナリデータのダウンロードなど、OpenAPI クライアントで対応できない場合に使用
 *
 * @example
 * const axios = await createAuthenticatedAxios();
 * const response = await axios.get('/api/downloads/icons', {
 *   params: { FileType: 'Avatar', ResourceId: userId, FileName: fileName },
 *   responseType: 'arraybuffer'
 * });
 * const buffer = Buffer.from(response.data);
 */
export async function createAuthenticatedAxios() {
  const token = await getAccessToken();
  const baseURL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7265";

  return Axios.create({
    baseURL,
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
