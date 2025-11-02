/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ユーザーリスト項目レスポンス
 */
export type UserListItemResponse = {
  /**
   * ユーザーID
   */
  id?: number;
  /**
   * ログインID
   */
  loginId: string | null;
  /**
   * ユーザー名
   */
  username: string | null;
  /**
   * メールアドレス
   */
  email: string | null;
  /**
   * アバタータイプ
   */
  avatarType?: string | null;
  /**
   * アイデンティティアイコンURL
   */
  identityIconUrl?: string | null;
  /**
   * アクティブフラグ
   */
  isActive?: boolean;
  /**
   * 作成日時
   */
  createdAt?: string;
  /**
   * 最終ログイン日時
   */
  lastLoginAt?: string | null;
  /**
   * ユーザーが持つロール数
   */
  roleCount?: number;
};
