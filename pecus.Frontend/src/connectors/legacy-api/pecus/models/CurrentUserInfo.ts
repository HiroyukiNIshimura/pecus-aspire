/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 現在ログイン中のユーザーの最小限情報
 */
export type CurrentUserInfo = {
  /**
   * 組織ID
   */
  organizationId: number;
  /**
   * メールアドレス
   */
  email: string;
  /**
   * 管理者権限を持つかどうか
   */
  isAdmin: boolean;
  /**
   * バックオフィス権限を持つかどうか
   */
  isBackOffice: boolean;
  /**
   * ユーザーID
   */
  id: number;
  /**
   * ユーザー名
   */
  username: string | null;
  /**
   * アイデンティティアイコンURL（表示用）
   * 必ず有効なURLが返されるため、クライアント側でnullチェック不要
   */
  identityIconUrl: string | null;
  /**
   * ユーザーがアクティブかどうか
   */
  isActive: boolean;
};
