/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タグ詳細レスポンス
 */
export type TagDetailResponse = {
    /**
     * タグID
     */
    id: number;
    /**
     * 組織ID
     */
    organizationId?: number;
    /**
     * タグ名
     */
    name?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 作成者ユーザーID
     */
    createdByUserId?: number;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * 更新者ユーザーID
     */
    updatedByUserId?: number | null;
    /**
     * アクティブ状態
     */
    isActive?: boolean;
    /**
     * このタグが付与されているアイテム数
     */
    itemCount?: number;
    /**
     * 楽観的ロック用RowVersion
     */
    rowVersion: number;
};

