/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タグリストアイテムレスポンス
 */
export type TagListItemResponse = {
    /**
     * タグID
     */
    id?: number;
    /**
     * タグ名
     */
    name?: string | null;
    /**
     * 作成日時
     */
    createdAt?: string;
    /**
     * 更新日時
     */
    updatedAt?: string | null;
    /**
     * アクティブ状態
     */
    isActive?: boolean;
    /**
     * このタグが付与されているアイテム数
     */
    itemCount?: number;
};

