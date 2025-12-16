/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * タスク種類マスタレスポンス
 */
export type MasterTaskTypeResponse = {
    /**
     * タスク種類ID
     */
    id: number | string;
    /**
     * タスク種類コード（例: "Bug", "Feature"）
     */
    code: string;
    /**
     * タスク種類名（日本語表示名）
     */
    name: string;
    /**
     * タスク種類説明
     */
    description?: string | null;
    /**
     * タスク種類アイコン（拡張子なしのファイル名）
     */
    icon?: string | null;
    /**
     * 表示順
     */
    displayOrder?: number | string;
};

