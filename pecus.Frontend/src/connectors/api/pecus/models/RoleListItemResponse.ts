/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ロールリスト項目レスポンス
 */
export type RoleListItemResponse = {
  /**
   * ロールID
   */
  id?: number;
  /**
   * ロール名
   */
  name: string | null;
  /**
   * ロールの説明
   */
  description?: string | null;
  /**
   * 作成日時
   */
  createdAt?: string;
  /**
   * ロールが持つ権限数
   */
  permissionCount?: number;
};
