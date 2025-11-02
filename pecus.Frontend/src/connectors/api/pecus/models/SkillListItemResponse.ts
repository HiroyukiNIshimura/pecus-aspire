/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * スキル一覧アイテムレスポンス
 */
export type SkillListItemResponse = {
  /**
   * スキルID
   */
  id?: number;
  /**
   * スキル名
   */
  name: string | null;
  /**
   * スキルの説明
   */
  description?: string | null;
  /**
   * 作成日時
   */
  createdAt?: string;
  /**
   * 更新日時
   */
  updatedAt?: string | null;
  /**
   * 更新者ユーザーID
   */
  updatedByUserId?: number | null;
  /**
   * スキルのアクティブ/非アクティブ状態
   */
  isActive?: boolean;
  /**
   * スキルの利用状況
   */
  userIds?: Array<string> | null;
  /**
   * ユーザー数
   */
  userCount?: number;
};
