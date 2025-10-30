/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ジャンル詳細レスポンス
 */
export type GenreDetailResponse = {
    /**
     * ジャンルID
     */
    id?: number;
    /**
     * ジャンル名
     */
    name: string | null;
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
     * 有効フラグ
     */
    isActive?: boolean;
};

