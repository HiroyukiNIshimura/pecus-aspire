import { getAccessToken } from "./auth";
import {
  configureOpenAPI,
  createApiClientInstances,
} from "./PecusApiClient.generated";
import Axios from "axios";
import type { ConcurrencyErrorResponseBody } from "./ConflictDataTypes.generated";
import { ErrorResponse } from "@/actions/types";
import { ApiError } from "./pecus/core/ApiError";
import type { WorkspaceMemberAssignmentsResponse } from "./pecus";
import { getApiBaseUrl } from "@/libs/env";

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
  let body;
  if (isApiError(error) && error.status === 404) {
    body = error.body ?? {};
  } else if (Axios.isAxiosError(error) && error.response?.status === 404) {
    body = error.response.data ?? {};
  } else {
    return undefined;
  }

  const message =
    (typeof body === "object" &&
    body !== null &&
    "message" in body
      ? (body as Record<string, unknown>).message
      : null) || '対象が見つかりません。';

  console.error('Not Found error detected:', message);
  return {
    success: false,
    error: 'not_found',
    message: String(message),
  };
}

export function detect403ValidationError(error: unknown): ErrorResponse | undefined {
  let body;
  if (isApiError(error) && error.status === 403) {
    body = error.body ?? {};
  } else if (Axios.isAxiosError(error) && error.response?.status === 403) {
    body = error.response.data ?? {};
  } else {
    return undefined;
  }

  const message =
    (typeof body === "object" &&
    body !== null &&
    "message" in body
      ? (body as Record<string, unknown>).message
      : null) || 'アクセスが禁止されています。';

  console.error('Forbidden error detected:', message);
  return {
    success: false,
    error: 'forbidden',
    message: String(message),
  };
}

/**
 * Viewer変更時のアサインメントエラー（409 Conflict）を検出
 * メンバーに担当タスク/アイテムがある場合に返される
 *
 * @param error - キャッチしたエラーオブジェクト
 * @returns アサインメントがある場合は WorkspaceMemberAssignmentsResponse、それ以外は null
 */
export function detectMemberHasAssignmentsError(error: unknown): WorkspaceMemberAssignmentsResponse | null {
  let body: unknown;
  if (isApiError(error) && error.status === 409) {
    body = error.body ?? {};
  } else if (Axios.isAxiosError(error) && error.response?.status === 409) {
    body = error.response.data ?? {};
  } else {
    return null;
  }

  // hasAssignments プロパティがある場合はアサインメントエラー
  if (
    typeof body === "object" &&
    body !== null &&
    "hasAssignments" in body &&
    (body as Record<string, unknown>).hasAssignments === true
  ) {
    console.error('Member has assignments error detected');
    return body as WorkspaceMemberAssignmentsResponse;
  }

  return null;
}

/**
 * エラーからHTTPステータスコードを抽出
 */
function getHttpStatus(error: unknown): number | undefined {
  if (isApiError(error)) {
    return error.status;
  }
  if (Axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * APIエラーからレスポンスボディのメッセージを抽出するヘルパー
 * 500系エラーの場合は null を返す（セキュリティ上、詳細を露出しない）
 */
function extractBodyMessage(error: unknown): string | null {
  const status = getHttpStatus(error);

  // 500系エラーの場合は body.message を使わない（セキュリティ対策）
  if (status !== undefined && status >= 500) {
    return null;
  }

  let body: unknown;

  if (isApiError(error)) {
    body = error.body;
  } else if (Axios.isAxiosError(error)) {
    body = error.response?.data;
  } else if (typeof error === 'object' && error !== null && 'body' in error) {
    body = (error as { body: unknown }).body;
  }

  if (typeof body === 'object' && body !== null && 'message' in body) {
    return String((body as Record<string, unknown>).message);
  }

  return null;
}

/**
 * 500系サーバーエラーを検出
 * セキュリティ上、詳細メッセージは返さずデフォルトメッセージを使用
 */
export function detect500ServerError(error: unknown, defaultMessage?: string): ErrorResponse | undefined {
  const status = getHttpStatus(error);

  if (status !== undefined && status >= 500) {
    console.error('Server error detected:', status);
    return {
      success: false,
      error: 'server',
      message: defaultMessage || 'サーバーエラーが発生しました。しばらく経ってから再度お試しください。',
    };
  }
  return undefined;
}

/**
 * エラーレスポンスを統一的に解析して ErrorResponse を返す
 *
 * 処理順序:
 * 1. 500+ Server Error → server エラー（body.message は使わない、セキュリティ対策）
 * 2. 400 Bad Request → validation エラー（body.message を優先）
 * 3. 401 Unauthorized → unauthorized エラー
 * 4. 403 Forbidden → forbidden エラー（body.message を優先）
 * 5. 404 Not Found → not_found エラー（body.message を優先）
 * 6. その他 → server エラー（body.message を優先、なければ defaultMessage）
 *
 * 注意: 409 Conflict は detectConcurrencyError または detectMemberHasAssignmentsError で
 *       先にハンドルすること（parseErrorResponse では汎用的な server エラーとして扱われる）
 */
export const parseErrorResponse = (error: unknown, defaultMessage?: string): ErrorResponse => {
  // 500+ Server Error: 詳細を隠蔽（セキュリティ対策）
  const error500 = detect500ServerError(error, defaultMessage);
  if (error500) return error500;

  // 400 Bad Request: バリデーションエラー
  const error400 = detect400ValidationError(error);
  if (error400) return error400;

  // 401 Unauthorized: 認証エラー
  const error401 = detect401ValidationError(error);
  if (error401) return error401;

  // 403 Forbidden: 権限エラー
  const error403 = detect403ValidationError(error);
  if (error403) return error403;

  // 404 Not Found: リソース未検出エラー
  const error404 = detect404ValidationError(error);
  if (error404) return error404;

  // その他のエラー: body.message を優先的に抽出
  const bodyMessage = extractBodyMessage(error);
  if (bodyMessage) {
    return {
      success: false,
      error: 'server',
      message: bodyMessage,
    };
  }

  // 文字列エラー
  if (typeof error === 'string') {
    return {
      success: false,
      error: 'server',
      message: error || defaultMessage || 'An unexpected error occurred',
    };
  }

  // Axios エラー（body.message がない場合）
  if (Axios.isAxiosError(error)) {
    return {
      success: false,
      error: 'server',
      message: defaultMessage || 'An unexpected error occurred',
    };
  }

  // 一般的な Error オブジェクト（ApiError 以外）
  if (error instanceof Error && !isApiError(error)) {
    return {
      success: false,
      error: 'server',
      message: error.message || defaultMessage || 'An unexpected error occurred',
    };
  }

  // デフォルト
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
  // BASE URL を環境に応じて決定（統一ヘルパー使用）
  const baseUrl = getApiBaseUrl();

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
  const baseURL = getApiBaseUrl();

  return Axios.create({
    baseURL,
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
