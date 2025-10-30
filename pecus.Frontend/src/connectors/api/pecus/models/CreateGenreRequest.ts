/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ジャンル登録リクエスト
 */
export type CreateGenreRequest = {
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
};

