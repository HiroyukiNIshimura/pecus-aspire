/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 組織更新リクエスト（バックエンドサービス用）
 */
export type BackendUpdateOrganizationRequest = {
    /**
     * 組織名
     */
    name?: string | null;
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
     * 電話番号
     */
    phoneNumber?: string | null;
    /**
     * メールアドレス
     */
    email?: string | null;
    /**
     * 有効フラグ
     */
    isActive?: boolean | null;
};

