/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 自ユーザー設定の更新リクエスト
 */
export type UpdateUserSettingRequest = {
    /**
     * メールを受信するかどうか
     */
    canReceiveEmail: boolean;
    /**
     * ユーザー設定の楽観的ロック用 RowVersion
     */
    rowVersion: number;
};

