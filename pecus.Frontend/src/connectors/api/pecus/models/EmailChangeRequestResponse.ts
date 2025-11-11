/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * メールアドレス変更リクエスト完了レスポンス
 */
export type EmailChangeRequestResponse = {
    /**
     * メッセージ
     */
    message: string;
    /**
     * 新しいメールアドレス（確認用）
     */
    newEmail: string;
    /**
     * トークン有効期限（UTC）
     */
    expiresAt: string;
    /**
     * 確認トークン（メール送信用、通常はフロントエンドには返さない）
     */
    token: string;
};

