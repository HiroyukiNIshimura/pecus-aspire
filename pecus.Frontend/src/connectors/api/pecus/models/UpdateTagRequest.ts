/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タグ更新リクエスト
 */
export type UpdateTagRequest = {
    /**
     * タグ名
     */
    name: string;
    /**
     * アクティブフラグ
     */
    isActive?: boolean | null;
    /**
     * タグの楽観的ロック用のRowVersion
     */
    rowVersion: number | string;
};

