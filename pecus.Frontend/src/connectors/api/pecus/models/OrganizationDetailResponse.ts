/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 組織詳細レスポンス
 */
export type OrganizationDetailResponse = {
    /**
     * 組織ID
     */
    id?: number;
    /**
     * 組織名
     */
    name: string | null;
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
    phoneNumber: string | null;
    /**
     * メールアドレス
     */
    email?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
    /**
     * 所属ユーザー数
     */
    userCount?: number;
};

