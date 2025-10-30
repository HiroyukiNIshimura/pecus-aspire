/**
 * Server Actions 共通型定義
 */

/**
 * API レスポンス型（統一）
 * Server Actions の戻り値として使用
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
