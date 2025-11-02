/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * プロフィール更新リクエスト
 */
export type UpdateProfileRequest = {
  /**
   * ユーザー名
   */
  username?: string | null;
  /**
   * アバタータイプ
   */
  avatarType?: string | null;
  /**
   * アバターURL
   */
  avatarUrl?: string | null;
  /**
   * スキルIDリスト
   */
  skillIds?: Array<number> | null;
};
