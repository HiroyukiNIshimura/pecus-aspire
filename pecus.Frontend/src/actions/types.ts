/**
 * Server Actions 共通型定義
 */

import type { ConflictLatestData } from '@/connectors/api/ConflictDataTypes.generated';

/**
 * 409 Conflict レスポンス型
 * 並行更新による競合時に、最新データと共に返される
 *
 * @template T - エンティティの汎用型パラメータ（将来の拡張用）
 */
export type ConflictResponse<_T> = {
  success: false;
  error: 'conflict';
  message: string;
  /**
   * 最新の DB データ
   * discriminator 型（union with type field）で型安全に定義
   * latest.type で各エンティティ型を判別可能
   */
  latest?: ConflictLatestData;
};

/**
 * 汎用エラーレスポンス型
 */
export type ErrorResponse = {
  success: false;
  error: 'validation' | 'server' | 'not_found' | 'forbidden' | string;
  message: string;
};

/**
 * API レスポンス型（統一）
 * Server Actions の戻り値として使用
 * - success: 成功
 * - conflict: 409 Conflict（並行更新による競合）
 * - error: その他のエラー（validation, server, not_found, forbidden）
 */
export type ApiResponse<T> = { success: true; data: T } | ConflictResponse<T> | ErrorResponse;

// ============================================
// ヘルパー関数
// ============================================

/**
 * エラーレスポンスを生成する内部ヘルパー
 */
function createErrorResponse<T>(errorType: ErrorResponse['error'], message: string): ApiResponse<T> {
  return {
    success: false,
    error: errorType,
    message,
  };
}

/**
 * バリデーションエラーレスポンスを生成
 * 入力値検証エラー（事前チェック）に使用
 *
 * @param message エラーメッセージ
 * @example
 * if (latitude < -90 || latitude > 90) {
 *   return validationError('緯度は-90から90の範囲内である必要があります。');
 * }
 */
export function validationError<T>(message: string): ApiResponse<T> {
  return createErrorResponse('validation', message);
}

/**
 * サーバーエラーレスポンスを生成
 * API レスポンスエラー（非例外）に使用
 *
 * @param message エラーメッセージ
 * @example
 * if (!response.ok) {
 *   return serverError(`位置情報の取得に失敗しました。(Status: ${response.status})`);
 * }
 */
export function serverError<T>(message: string): ApiResponse<T> {
  return createErrorResponse('server', message);
}

/**
 * Not Found エラーレスポンスを生成
 *
 * @param message エラーメッセージ
 */
export function notFoundError<T>(message: string): ApiResponse<T> {
  return createErrorResponse('not_found', message);
}

/**
 * Forbidden エラーレスポンスを生成
 *
 * @param message エラーメッセージ
 */
export function forbiddenError<T>(message: string): ApiResponse<T> {
  return createErrorResponse('forbidden', message);
}
