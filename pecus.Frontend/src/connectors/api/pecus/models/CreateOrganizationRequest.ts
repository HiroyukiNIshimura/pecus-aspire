/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 組織登録リクエスト
 */
export type CreateOrganizationRequest = {
    /**
     * 組織名
     */
    name: string;
    /**
     * 電話番号
     */
    phoneNumber: string;
    /**
     * 組織コード
     */
    code?: string | null;
    /**
     * 組織の説明
     */
    description?: string | null;
    /**
     * 代表者名
     */
    representativeName?: string | null;
    /**
     * メールアドレス
     */
    email?: string | null;
    /**
     * 管理者ユーザー名
     */
    adminUsername: string;
    /**
     * 管理者メールアドレス
     */
    adminEmail: string;
};

