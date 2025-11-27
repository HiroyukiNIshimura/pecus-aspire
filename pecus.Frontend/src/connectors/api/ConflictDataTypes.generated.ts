/**
 * 409 Conflict レスポンスで返される最新データの型定義
 *
 * この ファイルは scripts/generate-conflict-types.js により自動生成されます。
 * 手動での編集は行わないでください。
 *
 * 更新するには以下を実行してください:
 * ```
 * npm run generate:conflict-types
 * ```
 *
 * 元になる OpenAPI 定義:
 * pecus.Frontend/.spec/open-api-scheme.json
 */

import type {
  OrganizationResponse,
  SkillDetailResponse,
  TagDetailResponse,
  UserDetailResponse,
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
      type: 'organization';
      data: OrganizationResponse;
    }
  | {
      type: 'skill';
      data: SkillDetailResponse;
    }
  | {
      type: 'tag';
      data: TagDetailResponse;
    }
  | {
      type: 'user';
      data: UserDetailResponse;
    }
  | {
      type: 'workspace';
      data: WorkspaceDetailResponse;
    }
  | {
      type: 'workspaceItem';
      data: WorkspaceItemDetailResponse;
    };
