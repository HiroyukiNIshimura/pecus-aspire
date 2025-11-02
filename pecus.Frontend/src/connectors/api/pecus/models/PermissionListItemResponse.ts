/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 権限リスト項目レスポンス
 */
export type PermissionListItemResponse = {
  /**
   * 権限ID
   */
  id?: number;
  /**
   * 権限名
   */
  name: string | null;
  /**
   * 権限の説明
   */
  description?: string | null;
  /**
   * 権限カテゴリ
   */
  category?: string | null;
  /**
   * 作成日時
   */
  createdAt?: string;
  /**
   * この権限を持つロール数
   */
  roleCount?: number;
};
