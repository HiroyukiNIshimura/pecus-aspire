/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ジャンル更新リクエスト
 */
export type UpdateGenreRequest = {
  /**
   * ジャンル名
   */
  name?: string | null;
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
  displayOrder?: number | null;
  /**
   * アクティブフラグ
   */
  isActive?: boolean | null;
};
