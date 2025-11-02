/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペース更新リクエスト
 */
export type UpdateWorkspaceRequest = {
  /**
   * ワークスペース名
   */
  name?: string | null;
  /**
   * ワークスペースコード
   */
  code?: string | null;
  /**
   * ワークスペースの説明
   */
  description?: string | null;
  /**
   * ジャンルID
   */
  genreId?: number | null;
  /**
   * アクティブフラグ
   */
  isActive?: boolean | null;
};
