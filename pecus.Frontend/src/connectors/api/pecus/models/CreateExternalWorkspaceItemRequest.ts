/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * 外部API経由でワークスペースアイテムを作成するためのリクエスト
 */
export type CreateExternalWorkspaceItemRequest = {
    /**
     * アイテムの件名
     */
    subject: string;
    /**
     * アイテムの本文（Markdown形式）
     */
    body: string;
    /**
     * オーナーのログインID
     */
    ownerLoginId: string;
};

