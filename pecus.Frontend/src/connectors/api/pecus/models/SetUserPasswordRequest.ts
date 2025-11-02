/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ユーザーパスワード設定リクエスト
 */
export type SetUserPasswordRequest = {
    /**
     * パスワード設定トークン（メールで送信されたもの）
     */
    token: string;
    /**
     * 新しいパスワード
     */
    password: string;
};

