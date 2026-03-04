/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 外部API経由でワークスペースアイテム作成のレスポンス
 */
export type CreateExternalWorkspaceItemResponse = {
    /**
     * ワークスペースコード
     */
    workspaceCode: string;
    /**
     * アイテム番号（ワークスペース内連番）
     */
    itemNumber: number;
    /**
     * アイテムの件名
     */
    subject: string;
    /**
     * 作成日時（UTC）
     */
    createdAt: string;
};

