/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースアイテム関連追加リクエスト
 */
export type AddWorkspaceItemRelationRequest = {
  /**
   * 関連先アイテムID
   */
  toItemId: number;
  /**
   * 関連タイプ（オプション）
   * 指定可能な値: "related", "blocks", "blocked_by", "depends_on", "duplicates", "subtask_of", "parent_of", "relates_to"
   */
  relationType?: string | null;
};
