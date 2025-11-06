/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * スキル詳細レスポンス
 */
export type SkillDetailResponse = {
    /**
     * スキルID
     */
    id?: number;
    /**
     * スキル名
     */
    name: string | null;
    /**
     * スキルの説明
     */
    description?: string | null;
    /**
     * 組織ID
     */
    organizationId?: number;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作成者ユーザーID
     */
    createdByUserId?: number | null;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * 更新者ユーザーID
     */
    updatedByUserId?: number | null;
    /**
     * スキルのアクティブ/非アクティブ状態
     */
    isActive?: boolean;
    /**
     * ユーザー数
     */
    userCount?: number;
    /**
     * 楽観的ロック用のRowVersion
     */
    rowVersion?: string | null;
};

