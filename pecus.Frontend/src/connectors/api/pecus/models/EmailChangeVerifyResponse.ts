/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * メールアドレス変更確認レスポンス
 */
export type EmailChangeVerifyResponse = {
    /**
     * メッセージ
     */
    message: string;
    /**
     * 変更後の新しいメールアドレス
     */
    newEmail: string;
    /**
     * 変更日時（UTC）
     */
    changedAt: string;
};

