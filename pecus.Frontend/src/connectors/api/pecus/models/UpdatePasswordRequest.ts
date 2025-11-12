/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * パスワード変更リクエスト
 */
export type UpdatePasswordRequest = {
    /**
     * 現在のパスワード（確認用）
     */
    currentPassword: string;
    /**
     * 新しいパスワード
     */
    newPassword: string;
};

