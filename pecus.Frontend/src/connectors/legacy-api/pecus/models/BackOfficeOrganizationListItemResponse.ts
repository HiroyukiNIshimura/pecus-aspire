/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * BackOffice用 組織リスト項目レスポンス
 */
export type BackOfficeOrganizationListItemResponse = {
    /**
     * 組織ID
     */
    id: number;
    /**
     * 組織名
     */
    name: string;
    /**
     * 組織コード
     */
    code?: string | null;
    /**
     * 代表者名
     */
    representativeName?: string | null;
    /**
     * 電話番号
     */
    phoneNumber: string;
    /**
     * メールアドレス
     */
    email?: string | null;
    /**
     * アクティブフラグ
     */
    isActive?: boolean;
    /**
     * デモ組織フラグ
     */
    isDemo?: boolean;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 所属ユーザー数
     */
    userCount?: number;
    /**
     * 楽観的ロック用バージョン番号
     */
    rowVersion: number;
};

