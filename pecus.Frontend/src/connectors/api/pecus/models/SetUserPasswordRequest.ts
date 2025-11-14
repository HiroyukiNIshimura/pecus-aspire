/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ユーザーパスワード設定リクエスト
 */
export type SetUserPasswordRequest = {
    token: string;
    password: string;
    resetAllDeviceSessions?: boolean | null;
};

