/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * BackOffice用 組織更新リクエスト
 */
export type BackOfficeUpdateOrganizationRequest = {
    /**
     * 代表者名
     */
    representativeName?: string | null;
    /**
     * 電話番号
     */
    phoneNumber?: string | null;
    /**
     * メールアドレス
     */
    email?: string | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean | null;
    /**
     * 楽観的ロック用バージョン番号
     */
    rowVersion: number;
};

