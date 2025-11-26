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
