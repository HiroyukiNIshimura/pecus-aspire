/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペース登録リクエスト
 */
export type CreateWorkspaceRequest = {
  /**
   * ワークスペース名
   */
  name: string;
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
};
