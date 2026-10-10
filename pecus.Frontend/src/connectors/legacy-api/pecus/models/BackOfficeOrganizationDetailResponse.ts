/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * BackOffice用 組織詳細レスポンス
 */
export type BackOfficeOrganizationDetailResponse = {
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
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * 所属ユーザー数
     */
    userCount?: number;
    /**
     * ワークスペース数
     */
    workspaceCount?: number;
    /**
     * 楽観的ロック用バージョン番号
     */
    rowVersion: number;
};

