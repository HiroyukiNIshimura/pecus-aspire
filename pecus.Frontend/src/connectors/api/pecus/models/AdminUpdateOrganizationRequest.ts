/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 組織更新リクエスト（管理者用）
 */
export type AdminUpdateOrganizationRequest = {
    /**
     * 組織名
     */
    name?: string | null;
    /**
     * 組織の説明
     */
    description?: string | null;
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
     * 組織の楽観的ロック用のRowVersion
     */
    rowVersion: number;
};

