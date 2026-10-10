/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * ワークスペースアイテム担当者更新リクエスト
 */
export type UpdateWorkspaceItemAssigneeRequest = {
    /**
     * 担当者ユーザーID（NULL で割り当て解除）
     */
    assigneeId?: number | null;
    /**
     * 楽観的ロック用バージョン
     */
    rowVersion: number;
};

