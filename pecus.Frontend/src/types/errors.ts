/**
 * API エラーレスポンスの型定義
 */
export interface ApiErrorResponse {
  code?: string;
  message?: string;
  statusCode?: number;
}

/**
 * エラーコード定義（バックエンド連携）
 */
export enum ErrorCode {
  // 認証関連
  UNAUTHORIZED = "UNAUTHORIZED",
  AUTHENTICATION_EXPIRED = "AUTHENTICATION_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",

  // 認可関連
  FORBIDDEN = "FORBIDDEN",
  PERMISSION_DENIED = "PERMISSION_DENIED",

  // リソース関連
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // バリデーション
  VALIDATION_ERROR = "VALIDATION_ERROR",
  BAD_REQUEST = "BAD_REQUEST",

  // サーバー関連
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // その他
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * HTTP ステータスコードからエラーコードを取得
 */
export function getErrorCodeFromStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 500:
      return ErrorCode.INTERNAL_SERVER_ERROR;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * API エラーかどうかを判定
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === "object" && error !== null && ("code" in error || "message" in error || "statusCode" in error)
  );
}

/**
 * 認証エラーかどうかを判定
 */
export function isAuthenticationError(error: unknown): boolean {
  if (isApiError(error)) {
    return (
      error.code === ErrorCode.UNAUTHORIZED ||
      error.code === ErrorCode.AUTHENTICATION_EXPIRED ||
      error.statusCode === 401
    );
  }
  return false;
}

/**
 * 認可エラーかどうかを判定
 */
export function isAuthorizationError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.code === ErrorCode.FORBIDDEN || error.code === ErrorCode.PERMISSION_DENIED || error.statusCode === 403;
  }
  return false;
}
