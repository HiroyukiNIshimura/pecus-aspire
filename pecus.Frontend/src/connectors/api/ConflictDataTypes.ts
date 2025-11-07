/**
 * 409 Conflict レスポンスで返される最新データの型定義
 *
 * 複数のエンティティ型に対応するため、discriminator 型（union with type field）を使用します。
 * 各レスポンスは `type` フィールドを持ち、TypeScript の型絞り込みが可能です。
 *
 * NOTE: 将来的に自動生成ツール（openapi-typescript-codegen 等）で生成することを想定しています。
 * 現在は手動で主要なエンティティ型をサポートしています。
 */

import type {
  OrganizationResponse,
  SkillDetailResponse,
  TagDetailResponse,
  UserResponse,
  WorkspaceDetailResponse,
  WorkspaceItemDetailResponse,
} from "./pecus";

/**
 * バックエンド ConcurrencyErrorResponse のボディ形式（409 Conflict）
 *
 * GlobalExceptionFilter が 409 Conflict 時に返すレスポンスボディです。
 * Server Actions で detectConcurrencyError の payload として受け取ります。
 *
 * @example
 * const concurrencyError = detectConcurrencyError(error);
 * if (concurrencyError) {
 *   const current = concurrencyError.payload.current; // 最新のエンティティデータ
 *   const message = concurrencyError.payload.message; // エラーメッセージ
 * }
 */
export type ConcurrencyErrorResponseBody<T = unknown> = {
  statusCode: number;
  message: string;
  current?: T;
};

/**
 * 409 Conflict で返される最新データ（discriminator 型）
 *
 * 各エンティティ型に対応するレスポンスを union 型で定義しています。
 * クライアント側では `latest.type` で型を判別し、`latest.data` にアクセスできます。
 *
 * @example
 * // switch 文での分岐
 * switch (latest?.type) {
 *   case 'workspace':
 *     console.log(latest.data.id);
 *     break;
 *   case 'tag':
 *     console.log(latest.data.name);
 *     break;
 *   // ...
 * }
 */
export type ConflictLatestData =
  | {
      type: 'workspace';
      data: WorkspaceDetailResponse;
    }
  | {
      type: 'tag';
      data: TagDetailResponse;
    }
  | {
      type: 'skill';
      data: SkillDetailResponse;
    }
  | {
      type: 'user';
      data: UserResponse;
    }
  | {
      type: 'organization';
      data: OrganizationResponse;
    }
  | {
      type: 'workspaceItem';
      data: WorkspaceItemDetailResponse;
    };


