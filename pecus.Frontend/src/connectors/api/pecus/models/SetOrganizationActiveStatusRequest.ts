/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 組織のアクティブ状態変更リクエスト
 */
export type SetOrganizationActiveStatusRequest = {
    /**
     * 有効フラグ
     */
    isActive: boolean;
    /**
     * 組織の楽観的ロック用のRowVersion
     */
    rowVersion: string;
};

