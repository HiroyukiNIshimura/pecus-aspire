/**
 * Server Actions 共通型定義
 */

/**
 * 409 Conflict レスポンス型
 * 並行更新による競合時に、最新データと共に返される
 */
export type ConflictResponse<T> = {
  success: false;
  error: "conflict";
  message: string;
  latest?: T;
};

/**
 * 汎用エラーレスポンス型
 */
export type ErrorResponse = {
  success: false;
  error: "validation" | "server" | "not_found" | "forbidden" | string;
  message: string;
};

/**
 * API レスポンス型（統一）
 * Server Actions の戻り値として使用
 * - success: 成功
 * - conflict: 409 Conflict（並行更新による競合）
 * - error: その他のエラー（validation, server, not_found, forbidden）
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | ConflictResponse<T>
  | ErrorResponse;
