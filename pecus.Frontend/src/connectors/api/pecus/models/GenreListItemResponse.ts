/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ジャンル一覧用レスポンス
 */
export type GenreListItemResponse = {
    /**
     * ジャンルID
     */
    id: number;
    /**
     * ジャンル名
     */
    name: string;
    /**
     * ジャンルの説明
     */
    description?: string | null;
    /**
     * ジャンルアイコン
     */
    icon?: string | null;
    /**
     * 表示順
     */
    displayOrder?: number;
    /**
     * このジャンルを使用しているワークスペース数
     */
    workspaceCount?: number;
    /**
     * 有効フラグ
     */
    isActive?: boolean;
};

