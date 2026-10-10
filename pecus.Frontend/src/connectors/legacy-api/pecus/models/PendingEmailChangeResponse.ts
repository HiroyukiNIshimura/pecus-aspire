/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 未使用メールアドレス変更トークン情報レスポンス
 */
export type PendingEmailChangeResponse = {
    /**
     * 変更予定の新しいメールアドレス
     */
    newEmail: string;
    /**
     * トークン有効期限（UTC）
     */
    expiresAt: string;
    /**
     * トークン作成日時（UTC）
     */
    createdAt: string;
};

