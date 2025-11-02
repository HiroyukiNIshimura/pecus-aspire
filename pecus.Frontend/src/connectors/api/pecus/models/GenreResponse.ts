/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ジャンル基本レスポンス
 */
export type GenreResponse = {
  /**
   * ジャンルID
   */
  id?: number;
  /**
   * ジャンル名
   */
  name: string | null;
  /**
   * ジャンルの説明
   */
  description?: string | null;
  /**
   * ジャンルアイコン
   */
  icon?: string | null;
  /**
   * 表示順
   */
  displayOrder?: number;
  /**
   * 作成日時
   */
  createdAt?: string;
  /**
   * 更新日時
   */
  updatedAt?: string | null;
  /**
   * 有効フラグ
   */
  isActive?: boolean;
};
