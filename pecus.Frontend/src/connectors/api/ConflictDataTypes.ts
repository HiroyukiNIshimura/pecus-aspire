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
  SkillResponse,
  TagResponse,
  UserResponse,
  WorkspaceItemResponse,
  WorkspaceResponse,
} from "./pecus";

/**
 * 409 Conflict で返される最新データ（discriminator 型）
 *
 * 各エンティティ型に対応するレスポンスを union 型で定義しています。
 * クライアント側では `latest.type` で型を判別し、`latest.data` にアクセスできます。
 *
 * @example
 * // 型ガード関数を使った安全なケース分岐
 * if (latest && assertConflictLatestDataType(latest, 'workspace')) {
 *   console.log(latest.data.name); // WorkspaceResponse の型がついている
 * }
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
      data: WorkspaceResponse;
    }
  | {
      type: 'tag';
      data: TagResponse;
    }
  | {
      type: 'skill';
      data: SkillResponse;
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
      data: WorkspaceItemResponse;
    };

/**
 * discriminator 型のヘルパー関数（型ガード）
 *
 * 値が有効な ConflictLatestData 型であることをチェックします。
 * runtime チェックと TypeScript の型絞り込みを両立しています。
 *
 * @param value - チェック対象の値
 * @returns 値が ConflictLatestData 型である場合 true
 *
 * @example
 * if (isConflictLatestData(latest)) {
 *   // latest は ConflictLatestData 型に絞られている
 *   console.log(latest.type, latest.data);
 * }
 */
export function isConflictLatestData(value: unknown): value is ConflictLatestData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'data' in value &&
    [
      'workspace',
      'tag',
      'skill',
      'user',
      'organization',
      'workspaceItem',
    ].includes((value as Record<string, unknown>).type as string)
  );
}

/**
 * 型安全なケース分岐用ヘルパー関数（型ガード）
 *
 * 指定した型が一致することをチェックし、TypeScript の型絞り込みを行います。
 *
 * @param latest - ConflictLatestData インスタンス
 * @param expectedType - 期待するエンティティ型
 * @returns 型が一致する場合 true、その場合 latest の型が絞られる
 *
 * @example
 * if (latest && assertConflictLatestDataType(latest, 'workspace')) {
 *   // ここでは latest は { type: 'workspace'; data: WorkspaceResponse } に絞られている
 *   console.log(latest.data.id, latest.data.name);
 * }
 */
export function assertConflictLatestDataType<T extends ConflictLatestData['type']>(
  latest: ConflictLatestData | null | undefined,
  expectedType: T,
): latest is Extract<ConflictLatestData, { type: T }> {
  return latest !== null && latest !== undefined && latest.type === expectedType;
}

/**
 * ConflictLatestData から特定の型のデータを取得するヘルパー関数
 *
 * @param latest - ConflictLatestData インスタンス
 * @param expectedType - 期待するエンティティ型
 * @returns 型が一致する場合はデータ、そうでない場合は null
 *
 * @example
 * const workspaceData = getConflictDataByType(latest, 'workspace');
 * if (workspaceData) {
 *   console.log(workspaceData.id);
 * }
 *
 * NOTE: 内部実装では assertConflictLatestDataType を使用することを推奨
 */
export function getConflictDataByType<T extends ConflictLatestData['type']>(
  latest: ConflictLatestData | null | undefined,
  expectedType: T,
): any | null {
  if (latest !== null && latest !== undefined && latest.type === expectedType) {
    return latest.data;
  }
  return null;
}
