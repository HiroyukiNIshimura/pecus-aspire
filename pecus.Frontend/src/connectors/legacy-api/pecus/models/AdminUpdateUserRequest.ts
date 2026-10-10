/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 管理者によるユーザー更新リクエスト
 */
export type AdminUpdateUserRequest = {
    /**
     * ユーザー名
     */
    username: string;
    /**
     * アクティブ状態
     */
    isActive: boolean;
    /**
     * スキルIDのリスト
     */
    skillIds?: Array<number>;
    /**
     * ロールIDのリスト
     */
    roleIds?: Array<number>;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

