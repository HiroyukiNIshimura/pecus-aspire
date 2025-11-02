/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * パスワードリセット実行リクエスト
 */
export type ResetPasswordRequest = {
  /**
   * パスワードリセットトークン（メールで送信されたもの）
   */
  token: string;
  /**
   * 新しいパスワード
   */
  password: string;
};
